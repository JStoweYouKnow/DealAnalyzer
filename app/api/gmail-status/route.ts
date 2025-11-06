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
    let isConnected = !!gmailTokensCookie;
    
    // If no cookie but we have userId, check database
    if (!isConnected && userId && process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        const dbTokens = await convexClient.query(apiModule.api.userOAuthTokens.getTokens, { userId });
        isConnected = !!dbTokens;
        
        if (isConnected) {
          console.log('[Gmail Status Check] Found tokens in database');
        }
      } catch (error) {
        console.error('[Gmail Status Check] Error checking database:', error);
      }
    }

    console.log('[Gmail Status Check]', {
      hasCookie: !!gmailTokensCookie,
      hasDbTokens: isConnected && !gmailTokensCookie,
      cookieExists: !!gmailTokensCookie,
      cookieValue: gmailTokensCookie ? 'PRESENT' : 'MISSING',
      userId: userId ? 'PRESENT' : 'MISSING'
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
