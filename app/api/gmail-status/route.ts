import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const gmailTokensCookie = cookieStore.get('gmailTokens');
    const isConnected = !!gmailTokensCookie;

    console.log(`[Gmail Status Check] Connected: ${isConnected}`);

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
