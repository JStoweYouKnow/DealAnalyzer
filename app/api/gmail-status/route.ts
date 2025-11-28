import { NextRequest, NextResponse } from "next/server";
import { cookies, headers } from "next/headers";
import { logger } from "@/lib/logger";

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try Clerk cookie-based auth first (for web)
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const { userId } = await auth();
    if (userId) {
      return userId;
    }
  } catch (error) {
    // Clerk auth not available, continue to bearer token check
  }

  // Try bearer token auth (for mobile apps)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        // Decode the JWT to extract the user ID
        const parts = token.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
          if (payload?.sub) {
            // Verify it's a Clerk token by checking the issuer
            if (payload.iss?.includes('clerk') || payload.iss?.includes('clerk.accounts')) {
              logger.info("✅ Authenticated via Clerk bearer token for Gmail status", {
                userId: payload.sub.substring(0, 20),
              });
              return payload.sub;
            }
          }
        }
      } catch (error) {
        logger.warn("❌ Failed to decode bearer token for Gmail status", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Get user ID from authentication (supports both cookie-based and bearer token auth)
    const userId = await getUserIdFromRequest(request);

    const cookieStore = await cookies();
    const headersList = await headers();
    const forwardedProto = headersList.get('x-forwarded-proto');
    const origin = headersList.get('origin');
    let isHttps = forwardedProto === 'https';

    if (!isHttps && origin) {
      try {
        isHttps = new URL(origin).protocol === 'https:';
      } catch {
        // Ignore invalid origin values
      }
    }

    const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1';
    const useSecureCookies = !isDevelopment && isHttps;

    // Debug: Log all cookies (only in development)
    if (process.env.NODE_ENV === 'development') {
      const allCookies = cookieStore.getAll();
      console.log('[Gmail Status Check] All cookies:', allCookies.map(c => c.name));
    }

    const gmailTokensCookie = cookieStore.get('gmailTokens');
    let isConnected = false;
    let tokenSource: 'cookie' | 'database' | 'none' = 'none';
    
    // Check if cookie exists and contains valid tokens
    if (gmailTokensCookie) {
      try {
        const tokens = JSON.parse(gmailTokensCookie.value);
        // Validate that tokens exist and are not empty
        if (tokens && 
            tokens.access_token && 
            tokens.access_token.trim() !== '' &&
            tokens.refresh_token && 
            tokens.refresh_token.trim() !== '') {
          isConnected = true;
          tokenSource = 'cookie';
          console.log('[Gmail Status Check] Valid tokens found in cookie');
        } else {
          console.log('[Gmail Status Check] Cookie exists but tokens are invalid/empty');
        }
      } catch (error) {
        console.error('[Gmail Status Check] Error parsing cookie:', error);
      }
    }
    
    // If no valid cookie but we have userId, check database
    // SECURITY: Use server-side action to retrieve tokens - never expose tokens to clients
    if (!isConnected && userId && process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        // SECURITY: Use action to retrieve tokens server-side only
        // This ensures tokens are never exposed to client code
        const dbTokens = await convexClient.action(apiModule.api.userOAuthTokens.retrieveTokensForServer, { userId });
        
        if (dbTokens && 
            dbTokens.accessToken && 
            dbTokens.accessToken.trim() !== '' &&
            dbTokens.refreshToken && 
            dbTokens.refreshToken.trim() !== '') {
          isConnected = true;
          tokenSource = 'database';
          console.log('[Gmail Status Check] Valid tokens found in database');
          
          // Refresh the cookie with tokens from database for faster access next time
          // SECURITY: Tokens are stored in httpOnly cookie, not exposed to client JavaScript
          const tokenData = {
            access_token: dbTokens.accessToken,
            refresh_token: dbTokens.refreshToken,
            scope: dbTokens.scope || '',
            token_type: dbTokens.tokenType || 'Bearer',
            expiry_date: dbTokens.expiryDate,
          };
          
          cookieStore.set('gmailTokens', JSON.stringify(tokenData), {
            httpOnly: true,
            secure: useSecureCookies,
            sameSite: 'lax',
            maxAge: 24 * 60 * 60, // 24 hours
            path: '/',
          });
          
          console.log('[Gmail Status Check] Refreshed cookie with tokens from database');
        } else {
          console.log('[Gmail Status Check] No valid tokens in database');
        }
      } catch (error) {
        console.error('[Gmail Status Check] Error checking database:', error);
      }
    }

    console.log('[Gmail Status Check]', {
      isConnected,
      tokenSource,
      hasCookie: !!gmailTokensCookie,
      cookieExists: !!gmailTokensCookie,
      cookieValue: gmailTokensCookie ? 'PRESENT' : 'MISSING',
      userId: userId ? 'PRESENT' : 'MISSING',
      hasConvexUrl: !!process.env.NEXT_PUBLIC_CONVEX_URL
    });

    return NextResponse.json({
      success: true,
      connected: isConnected
    });
  } catch (error) {
    console.error("Error checking Gmail status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to check Gmail connection status" },
      { status: 500 }
    );
  }
}
