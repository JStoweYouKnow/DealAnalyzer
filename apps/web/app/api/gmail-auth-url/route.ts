import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import type { GenerateAuthUrlOpts } from "google-auth-library";
import { logger } from "@/lib/logger";

const DEFAULT_PROJECT_DOMAIN = process.env.NEXT_PUBLIC_APP_DOMAIN;

// Helper function to decode base64url with padding
function decodeBase64(base64: string): string {
  // Convert from base64url to base64
  let padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
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
          logger.warn("⚠️ Invalid JWT format - expected 3 parts", {
            actualParts: parts.length,
          });
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

    // Always use web redirect URI (required by Google OAuth)
    // The web callback will then redirect to the mobile app via deep link
    // This is the standard OAuth flow for mobile apps
    const forwardedProto = request.headers.get('x-forwarded-proto');
    let protocol = forwardedProto || url.protocol.replace(':', '') || 'https';
    let host = request.headers.get('host') || url.hostname;

    // Check if request is from mobile app
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    const isMobileRequest = origin.includes('api.comfortfinder.com') ||
      origin.includes('comfortfinder.projcomfort.com') ||
      url.hostname.includes('api.comfortfinder.com') ||
      url.hostname.includes('comfortfinder.projcomfort.com') ||
      url.searchParams.get('platform') === 'mobile' ||
      request.headers.get('user-agent')?.includes('Expo') ||
      request.headers.get('user-agent')?.includes('ReactNative');

    // If NEXT_PUBLIC_APP_DOMAIN is set, use it (for production consistency)
    if (DEFAULT_PROJECT_DOMAIN) {
      try {
        const parsed = new URL(
          DEFAULT_PROJECT_DOMAIN.startsWith('http')
            ? DEFAULT_PROJECT_DOMAIN
            : `https://${DEFAULT_PROJECT_DOMAIN}`
        );
        protocol = parsed.protocol.replace(':', '') || protocol;
        host = parsed.host || host;
        console.log('[Gmail Auth URL] Using NEXT_PUBLIC_APP_DOMAIN:', host);
      } catch (error) {
        console.warn('Invalid NEXT_PUBLIC_APP_DOMAIN, falling back to request host:', error);
        host = DEFAULT_PROJECT_DOMAIN;
        protocol = protocol || 'https';
      }
    } else if (isMobileRequest) {
      // For mobile requests, prefer the API domain if available
      // This ensures redirect URI matches where the callback will be received
      console.log('[Gmail Auth URL] Mobile request detected, using request host:', host);
    }

    if (!host) {
      throw new Error('Unable to determine host for Gmail redirect');
    }

    // Always use web callback - it will redirect to mobile app via deep link
    const redirectUri = `${protocol}://${host}/api/gmail-callback`;

    if (isMobileRequest) {
      console.log('[Gmail Auth URL] Mobile app request - using web callback (will redirect to deep link)');
    }

    console.log('[Gmail Auth URL] Redirect URI determination:', {
      requestHost: request.headers.get('host'),
      requestUrl: request.url,
      origin: request.headers.get('origin'),
      referer: request.headers.get('referer'),
      isMobileRequest,
      DEFAULT_PROJECT_DOMAIN,
      finalRedirectUri: redirectUri,
    });

    // Create auth URL with dynamic redirect URI
    const auth = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const scopes = ['https://www.googleapis.com/auth/gmail.readonly'];

    // Include userId in state parameter so we can retrieve it in the callback
    // State is base64url encoded to ensure it's URL-safe (no padding, URL-safe characters)
    let state: string;
    try {
      const stateData = JSON.stringify({ userId });
      state = Buffer.from(stateData).toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, ''); // Remove padding for base64url
      console.log('[Gmail Auth URL] Generated state parameter', {
        userId: userId.substring(0, 20),
        stateLength: state.length,
      });
    } catch (error) {
      console.error('[Gmail Auth URL] Error encoding state:', error);
      // Fallback: use userId directly (less secure but works)
      state = userId;
    }

    const authUrlConfig: GenerateAuthUrlOpts = {
      access_type: 'offline',
      scope: scopes,
      include_granted_scopes: true,
      // Force refresh token by using 'consent' prompt.
      // This is crucial if tokens were previously deleted from our DB but not revoked from Google.
      prompt: 'consent',
      state, // Include userId in state for callback
    };

    const authUrl = auth.generateAuthUrl(authUrlConfig);

    // Parse the generated auth URL to extract redirect_uri for verification
    let redirectUriInUrl = 'unknown';
    try {
      const urlObj = new URL(authUrl);
      redirectUriInUrl = urlObj.searchParams.get('redirect_uri') || 'not found';
    } catch (e) {
      console.warn('[Gmail Auth URL] Could not parse generated auth URL:', e);
    }

    console.log('[Gmail Auth URL] Generated OAuth URL', {
      userId: userId ? userId.substring(0, 20) + '...' : 'MISSING',
      redirectUri,
      redirectUriInUrl, // The actual redirect_uri in the generated URL
      redirectUriMatch: redirectUri === decodeURIComponent(redirectUriInUrl),
      hasState: !!state,
      stateLength: state?.length,
      requestUrl: request.url,
      fullAuthUrl: authUrl, // Log full URL for debugging
    });

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

