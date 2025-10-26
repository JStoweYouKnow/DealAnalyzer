import { NextRequest, NextResponse } from "next/server";
import { emailMonitoringService } from "../../../server/email-service";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { success: false, error: "Authorization code is required" },
        { status: 400 }
      );
    }

    const tokens = await emailMonitoringService.getTokens(code);
    
    // Store tokens in cookie
    const cookieStore = await cookies();
    cookieStore.set('gmailTokens', JSON.stringify({
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || undefined
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 // 24 hours
    });
    
  // Redirect to deals page
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  const host = request.headers.get('host') || 'localhost:3002';
  const dealsUrl = `${protocol}://${host}/deals`;
  
  return NextResponse.redirect(dealsUrl);
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete Gmail authorization" },
      { status: 500 }
    );
  }
}

