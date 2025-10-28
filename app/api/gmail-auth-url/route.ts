import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    // Dynamically construct the redirect URI based on the request
    // Use the main production domain for consistency
    const url = new URL(request.url);
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    let host = request.headers.get('host') || url.hostname;
    
    // Extract just the main domain (remove preview deployment suffixes)
    // e.g., "comfort-finder-analyzer-9vh7byfjs-james-stowes-projects.vercel.app" -> "comfort-finder-analyzer.vercel.app"
    if (host.includes('vercel.app')) {
      const mainDomainMatch = host.match(/^(comfort-finder-analyzer)\.(vercel\.app|com)$/);
      if (mainDomainMatch) {
        host = `${mainDomainMatch[1]}.${mainDomainMatch[2]}`;
      }
    }
    
    const redirectUri = `${protocol}://${host}/api/gmail-callback`;
    
    // Create auth URL with dynamic redirect URI
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'select_account',
    });
    
    console.log("Generated auth URL:", authUrl);
    console.log("Redirect URI in use:", redirectUri);
    
    return NextResponse.json({
      success: true,
      authUrl
    });
  } catch (error) {
    console.error("Error getting Gmail auth URL:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get Gmail authorization URL" },
      { status: 500 }
    );
  }
}

