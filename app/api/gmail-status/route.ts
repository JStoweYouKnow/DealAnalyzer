import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
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

    const cookieStore = await cookies();

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
    if (!isConnected && userId && process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        const dbTokens = await convexClient.query(apiModule.api.userOAuthTokens.getTokens, { userId });
        
        if (dbTokens && 
            dbTokens.accessToken && 
            dbTokens.accessToken.trim() !== '' &&
            dbTokens.refreshToken && 
            dbTokens.refreshToken.trim() !== '') {
          isConnected = true;
          tokenSource = 'database';
          console.log('[Gmail Status Check] Valid tokens found in database');
          
          // Refresh the cookie with tokens from database for faster access next time
          const tokenData = {
            access_token: dbTokens.accessToken,
            refresh_token: dbTokens.refreshToken,
            scope: dbTokens.scope || '',
            token_type: dbTokens.tokenType || 'Bearer',
            expiry_date: dbTokens.expiryDate,
          };
          
          cookieStore.set('gmailTokens', JSON.stringify(tokenData), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
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
