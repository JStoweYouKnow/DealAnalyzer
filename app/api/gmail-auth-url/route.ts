import { NextResponse } from "next/server";
import { google } from "googleapis";

const DEFAULT_PROJECT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;

export async function GET(request: Request) {
  try {
    // Check for a "clear" parameter to force account selection
    const url = new URL(request.url);
    const clearSession = url.searchParams.get('clear') === 'true';
    
    // Dynamically construct the redirect URI based on the request
    // Allow overriding with NEXT_PUBLIC_APP_DOMAIN for production if needed
    const forwardedProto = request.headers.get('x-forwarded-proto');
    let protocol = forwardedProto || url.protocol.replace(':', '') || 'https';
    let host = request.headers.get('host') || url.hostname;

    if (DEFAULT_PROJECT_DOMAIN) {
      try {
        const parsed = new URL(
          DEFAULT_PROJECT_DOMAIN.startsWith('http')
            ? DEFAULT_PROJECT_DOMAIN
            : `https://${DEFAULT_PROJECT_DOMAIN}`
        );
        protocol = parsed.protocol.replace(':', '') || protocol;
        host = parsed.host || host;
      } catch (error) {
        console.warn('Invalid NEXT_PUBLIC_APP_DOMAIN, falling back to request host:', error);
        host = DEFAULT_PROJECT_DOMAIN;
        protocol = protocol || 'https';
      }
    }

    if (!host) {
      throw new Error('Unable to determine host for Gmail redirect');
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

