import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import type { GenerateAuthUrlOpts } from "google-auth-library";
import { logger } from "@/lib/logger";

const DEFAULT_PROJECT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;

// Helper function to decode base64 with padding
function decodeBase64(base64: string): string {
  // Add padding if needed
  let padded = base64;
  while (padded.length % 4) {
    padded += '=';
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

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
          // Decode the payload (second part of JWT) with proper base64 padding
          const payload = JSON.parse(decodeBase64(parts[1]));
          if (payload?.sub) {
            // Verify it's a Clerk token by checking the issuer
            if (payload.iss?.includes('clerk') || payload.iss?.includes('clerk.accounts')) {
              logger.info("✅ Authenticated via Clerk bearer token for Gmail auth URL", {
                userId: payload.sub.substring(0, 20),
              });
              return payload.sub;
            } else {
              logger.warn("⚠️ Token issuer is not Clerk", {
                issuer: payload.iss,
              });
            }
          } else {
            logger.warn("⚠️ Token payload missing sub claim", {
              payloadKeys: Object.keys(payload || {}),
            });
          }
        } else {
          logger.warn("⚠️ Invalid JWT format - expected 3 parts, got", parts.length);
        }
      } catch (error) {
        logger.warn("❌ Failed to decode bearer token for Gmail auth URL", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      console.log('[Gmail Auth URL] ❌ Authentication failed', {
        hasAuthHeader: !!request.headers.get("authorization"),
        authHeaderPreview: request.headers.get("authorization")?.substring(0, 30),
      });
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    console.log('[Gmail Auth URL] ✅ Authenticated request', {
      userId: userId.substring(0, 20),
    });
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

    const authUrlConfig: GenerateAuthUrlOpts = {
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      prompt: 'select_account', // default to account chooser for first-time auth
    };
    
    // Force account selection and consent if requested via `clear=true`
    if (clearSession) {
      authUrlConfig.prompt = 'select_account consent';
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

