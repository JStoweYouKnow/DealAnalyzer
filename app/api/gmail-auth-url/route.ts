import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(request: Request) {
  try {
    // Check for a "clear" parameter to force account selection
    const url = new URL(request.url);
    const clearSession = url.searchParams.get('clear') === 'true';
    
    // Dynamically construct the redirect URI based on the request
    // Use the main production domain for consistency
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    let host = request.headers.get('host') || url.hostname;
    
    // Extract just the main domain (remove preview deployment suffixes)
    // e.g., "comfort-finder-analyzer-9vh7byfjs-james-stowes-projects.vercel.app" -> "comfort-finder-analyzer.vercel.app"
    if (host.includes('vercel.app')) {
      // Match any Vercel subdomain pattern and extract just the base project name
      const mainDomainMatch = host.match(/(comfort-finder-analyzer)[^.]*\.(vercel\.app)$/);
      if (mainDomainMatch) {
        host = `${mainDomainMatch[1]}.${mainDomainMatch[2]}`;
      }
    }
    
    // Fallback to main production domain if we're on Vercel
    if (host.includes('vercel.app') && !host.match(/^comfort-finder-analyzer\.vercel\.app$/)) {
      host = 'comfort-finder-analyzer.vercel.app';
    }
    
    const redirectUri = `${protocol}://${host}/api/gmail-callback`;
    
    // Create auth URL with dynamic redirect URI
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

    const authUrlConfig: any = {
      access_type: 'offline',
      scope: scopes,
    };
    
    // Force account selection if clear parameter is present
    if (clearSession) {
      authUrlConfig.prompt = 'select_account';
    }

    const authUrl = auth.generateAuthUrl(authUrlConfig);
    
    console.log("Generated auth URL:", authUrl);
    console.log("Redirect URI in use:", redirectUri);
    console.log("Request URL:", request.url);
    
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

