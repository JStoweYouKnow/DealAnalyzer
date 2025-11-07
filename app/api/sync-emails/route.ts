import { NextResponse } from "next/server";
import { emailMonitoringService } from "../../../server/email-service";
import { storage } from "../../../server/storage";
import { cookies } from "next/headers";
import { google } from "googleapis";
import type { EmailMonitoringResponse } from "../../../shared/schema";

// Increase timeout for this route (Vercel Pro allows up to 60s, Hobby is 10s)
export const maxDuration = 60; // 60 seconds
export const runtime = 'nodejs'; // Use Node.js runtime

export async function POST() {
  try {
    // Get user ID from authentication (try Clerk first, then fallback)
    let userId: string | null = null;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (error) {
      // Clerk not available or not configured
    }

    // Check if user has Gmail tokens - first check cookies, then database
    const cookieStore = await cookies();
    let gmailTokensCookie = cookieStore.get('gmailTokens');
    let gmailTokens: any = null;
    
    console.log('[Sync Emails] Starting token retrieval', {
      hasCookie: !!gmailTokensCookie,
      hasUserId: !!userId,
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL
    });
    
    // Try to get tokens from cookie first
    if (gmailTokensCookie) {
      try {
        gmailTokens = JSON.parse(gmailTokensCookie.value);
        console.log('[Sync Emails] Found tokens in cookie', {
          hasAccessToken: !!gmailTokens.access_token,
          hasRefreshToken: !!gmailTokens.refresh_token
        });
      } catch (error) {
        console.error('[Sync Emails] Error parsing cookie tokens:', error);
        gmailTokens = null;
      }
    }
    
    // If no tokens in cookie and we have userId, try database
    // SECURITY: Use server-side action to retrieve tokens - never expose tokens to clients
    if (!gmailTokens && userId && process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        console.log('[Sync Emails] Attempting to retrieve tokens from database for userId:', userId.substring(0, 8) + '...');
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        // SECURITY: Use action to retrieve tokens server-side only
        // This ensures tokens are never exposed to client code
        const dbTokens = await convexClient.action(apiModule.api.userOAuthTokens.retrieveTokensForServer, { userId });
        
        if (dbTokens) {
          console.log('[Sync Emails] Found tokens in database', {
            hasAccessToken: !!dbTokens.accessToken,
            hasRefreshToken: !!dbTokens.refreshToken
          });
          gmailTokens = {
            access_token: dbTokens.accessToken,
            refresh_token: dbTokens.refreshToken,
            scope: dbTokens.scope,
            token_type: dbTokens.tokenType || 'Bearer',
            expiry_date: dbTokens.expiryDate,
          };
          
          // Refresh the cookie with tokens from database
          // SECURITY: Tokens are stored in httpOnly cookie, not exposed to client JavaScript
          const tokenData = {
            access_token: gmailTokens.access_token,
            refresh_token: gmailTokens.refresh_token,
            scope: gmailTokens.scope || '',
            token_type: gmailTokens.token_type || 'Bearer',
            expiry_date: gmailTokens.expiry_date,
          };
          
          cookieStore.set('gmailTokens', JSON.stringify(tokenData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/',
          });
          
          console.log('[Sync Emails] Refreshed cookie with tokens from database');
        } else {
          console.log('[Sync Emails] No tokens found in database for userId:', userId.substring(0, 8) + '...');
        }
      } catch (error) {
        console.error('[Sync Emails] Error retrieving tokens from database:', error);
        if (error instanceof Error) {
          console.error('[Sync Emails] Error details:', error.message, error.stack);
        }
      }
    }
    
    // Validate tokens before proceeding - check for both null/undefined and empty strings
    const accessToken = typeof gmailTokens?.access_token === 'string' ? gmailTokens.access_token.trim() : '';
    const refreshToken = typeof gmailTokens?.refresh_token === 'string' ? gmailTokens.refresh_token.trim() : '';
    
    if (!gmailTokens || !accessToken || !refreshToken) {
      console.error('[Sync Emails] Missing or invalid tokens', {
        hasTokens: !!gmailTokens,
        hasAccessToken: !!gmailTokens?.access_token,
        accessTokenLength: accessToken.length,
        hasRefreshToken: !!gmailTokens?.refresh_token,
        refreshTokenLength: refreshToken.length
      });
      return NextResponse.json(
        { success: false, error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 401 }
      );
    }
    
    // Update gmailTokens with trimmed values
    gmailTokens.access_token = accessToken;
    gmailTokens.refresh_token = refreshToken;
    
    console.log('[Sync Emails] Tokens validated, proceeding with email sync');

    // Set credentials for email service with userId and token metadata
    // The OAuth2 client will automatically refresh tokens if needed
    try {
      console.log('[Sync Emails] Setting credentials for email service');
      
      // Create a token refresh callback that properly handles cookie updates
      // This callback clones gmailTokens, updates the access_token, and ensures cookieStore.set() completes
      // The Promise returned by this callback is awaited in the email-service token refresh handler
      // This prevents race conditions where the HTTP response might be sent before cookies are updated
      const onTokenRefresh = async (refreshedTokens: {
        access_token: string;
        refresh_token?: string;
        scope?: string;
        expiry_date?: number;
        token_type?: string;
      }): Promise<void> => {
        // Clone gmailTokens to avoid mutating the original
        const updatedTokens = {
          ...gmailTokens,
          access_token: refreshedTokens.access_token,
          refresh_token: refreshedTokens.refresh_token || gmailTokens.refresh_token,
          scope: refreshedTokens.scope || gmailTokens.scope,
          expiry_date: refreshedTokens.expiry_date ?? gmailTokens.expiry_date,
          token_type: refreshedTokens.token_type || gmailTokens.token_type,
        };
        
        // Get a fresh cookies() store inside the async handler
        const freshCookieStore = await cookies();
        
        // Prepare token data for cookie
        const tokenData = {
          access_token: updatedTokens.access_token,
          refresh_token: updatedTokens.refresh_token,
          scope: updatedTokens.scope || '',
          token_type: updatedTokens.token_type || 'Bearer',
          expiry_date: updatedTokens.expiry_date,
        };
        
        // Set cookie (Next.js cookies().set() is synchronous and sets headers immediately)
        // The async callback ensures this operation completes before the Promise resolves
        freshCookieStore.set('gmailTokens', JSON.stringify(tokenData), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60, // 24 hours
          path: '/',
        });
        
        // Ensure the operation is complete by awaiting a microtask
        // This ensures the cookie update is fully processed before the Promise resolves
        await Promise.resolve();
        
        console.log('[Sync Emails] Token refresh: Cookie updated with new access token');
      };
      
      await emailMonitoringService.setCredentials(
        gmailTokens.access_token,
        gmailTokens.refresh_token,
        userId || undefined,
        gmailTokens.scope,
        gmailTokens.expiry_date,
        gmailTokens.token_type,
        onTokenRefresh
      );
      console.log('[Sync Emails] Credentials set successfully');
    } catch (error) {
      console.error('[Sync Emails] Error setting credentials:', error);
      return NextResponse.json(
        { success: false, error: `Failed to set Gmail credentials: ${error instanceof Error ? error.message : 'Unknown error'}` },
        { status: 500 }
      );
    }

    // Search for real estate emails (limit to 10 to avoid timeouts on serverless)
    // Process in smaller batches to stay within timeout limits
    const maxEmails = 10;
    console.log(`[Sync Emails] Starting email search for up to ${maxEmails} emails...`);
    let emailDeals: any[] = [];
    try {
      emailDeals = await emailMonitoringService.searchRealEstateEmails(maxEmails);
      console.log(`[Sync Emails] Email search completed. Found ${emailDeals.length} emails after filtering.`);
    } catch (error) {
      console.error('[Sync Emails] Error searching emails:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return NextResponse.json(
        { success: false, error: `Failed to search emails: ${errorMessage}` },
        { status: 500 }
      );
    }
    
    // Store new deals in storage, checking for duplicates
    const storedDeals = [];
    console.log(`Syncing ${emailDeals.length} email deals from Gmail`);
    
    // Process emails with timeout protection
    const startTime = Date.now();
    const maxProcessingTime = 45000; // 45 seconds (leave 5s buffer for response)
    
    for (let i = 0; i < emailDeals.length; i++) {
      // Check if we're running out of time
      if (Date.now() - startTime > maxProcessingTime) {
        console.log(`Timeout approaching, processed ${i} of ${emailDeals.length} emails`);
        break;
      }
      
      const deal = emailDeals[i];
      console.log(`Processing deal ${i + 1}/${emailDeals.length}: ${deal.id} - "${deal.subject?.substring(0, 50)}..."`);
      
      try {
        // Check if deal already exists by ID (parallel check)
        const [existingDeal, contentHash] = await Promise.all([
          storage.getEmailDeal(deal.id),
          Promise.resolve(emailMonitoringService.generateContentHash(deal.subject, deal.sender, deal.emailContent))
        ]);
        
        // Check for duplicate by hash
        const duplicateByHash = await storage.findEmailDealByContentHash(contentHash);
        
        if (!existingDeal && !duplicateByHash) {
          console.log(`Creating new email deal with ID: ${deal.id}`);
          const dealWithHash = { ...deal, contentHash };
          const storedDeal = await storage.createEmailDeal(dealWithHash);
          console.log(`Stored deal with final ID: ${storedDeal.id}`);
          storedDeals.push(storedDeal);
        } else {
          console.log(`Skipping duplicate deal: ${deal.id}`);
        }
      } catch (error) {
        console.error(`Error processing deal ${deal.id}:`, error);
        // Continue with next deal instead of failing completely
      }
    }
    
    console.log(`Successfully stored ${storedDeals.length} new email deals`);

    const response: EmailMonitoringResponse = {
      success: true,
      data: storedDeals
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error syncing emails:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to sync emails: ${errorMessage}` },
      { status: 500 }
    );
  }
}

