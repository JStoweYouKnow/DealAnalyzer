import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();

    // Debug: Log all cookies (only in development)
    if (process.env.NODE_ENV === 'development') {
      const allCookies = cookieStore.getAll();
      console.log('[Gmail Status Check] All cookies:', allCookies.map(c => c.name));
    }

    const gmailTokensCookie = cookieStore.get('gmailTokens');
    const isConnected = !!gmailTokensCookie;

    console.log('[Gmail Status Check]', {
      hasCookie: isConnected,
      cookieExists: !!gmailTokensCookie,
      cookieValue: gmailTokensCookie ? 'PRESENT' : 'MISSING'
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
