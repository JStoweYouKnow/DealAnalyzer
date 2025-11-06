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
    // Check if user has Gmail tokens
    const cookieStore = await cookies();
    const gmailTokensCookie = cookieStore.get('gmailTokens');
    
    if (!gmailTokensCookie) {
      return NextResponse.json(
        { success: false, error: "Gmail not connected. Please connect your Gmail account first." },
        { status: 401 }
      );
    }

    const gmailTokens = JSON.parse(gmailTokensCookie.value);

    // Set credentials for email service
    // The OAuth2 client will automatically refresh tokens if needed
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    
    auth.setCredentials({
      access_token: gmailTokens.access_token,
      refresh_token: gmailTokens.refresh_token
    });

    // Handle token refresh events
    auth.on('tokens', (tokens) => {
      if (tokens.access_token) {
        // Update cookies with new access token if refreshed
        gmailTokens.access_token = tokens.access_token;
        cookieStore.set('gmailTokens', JSON.stringify(gmailTokens), {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 // 24 hours
        });
        console.log('Access token refreshed and saved to cookies');
      }
    });

    await emailMonitoringService.setCredentials(
      gmailTokens.access_token,
      gmailTokens.refresh_token
    );

    // Search for real estate emails (limit to 10 to avoid timeouts on serverless)
    // Process in smaller batches to stay within timeout limits
    const maxEmails = 10;
    console.log(`Starting email search for up to ${maxEmails} emails...`);
    const emailDeals = await emailMonitoringService.searchRealEstateEmails(maxEmails);
    console.log(`Email search completed. Found ${emailDeals.length} emails after filtering.`);
    
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

