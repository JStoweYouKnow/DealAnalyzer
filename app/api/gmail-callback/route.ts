import { NextRequest, NextResponse } from "next/server";
import { emailMonitoringService } from "../../../server/email-service";
import { cookies } from "next/headers";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Log immediately when callback is received - this is critical for debugging
  const timestamp = new Date().toISOString();
  console.log('');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('[Gmail Callback] ========== CALLBACK RECEIVED ==========');
  console.log('[Gmail Callback] Timestamp:', timestamp);
  console.log('[Gmail Callback] Request URL:', request.url);
  console.log('[Gmail Callback] Request method:', request.method);
  console.log('[Gmail Callback] Headers:', {
    host: request.headers.get('host'),
    'user-agent': request.headers.get('user-agent'),
    'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
    'x-forwarded-for': request.headers.get('x-forwarded-for'),
    origin: request.headers.get('origin'),
    referer: request.headers.get('referer'),
  });
  console.log('═══════════════════════════════════════════════════════════');
  console.log('');

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    console.log('[Gmail Callback] Query parameters:', {
      hasCode: !!code,
      codeLength: code?.length,
      hasState: !!state,
      stateLength: state?.length,
      hasError: !!error,
      error,
      allParams: Object.fromEntries(searchParams.entries()),
    });

    if (error) {
      console.error('[Gmail Callback] OAuth error from Google:', error);
      return NextResponse.json(
        { success: false, error: `OAuth error: ${error}` },
        { status: 400 }
      );
    }

    if (!code || typeof code !== 'string') {
      console.error('[Gmail Callback] Missing authorization code');
      return NextResponse.json(
        { success: false, error: "Authorization code is required" },
        { status: 400 }
      );
    }

    // Get user ID from state parameter (for mobile OAuth) or authentication (for web)
    let userId: string | null = null;

    // Try to extract userId from state parameter (used for mobile OAuth)
    if (state) {
      try {
        // Decode base64url (add padding if needed, convert URL-safe chars back)
        let base64 = state.replace(/-/g, '+').replace(/_/g, '/');
        // Add padding
        while (base64.length % 4) {
          base64 += '=';
        }
        const stateData = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));
        if (stateData?.userId && typeof stateData.userId === 'string') {
          userId = stateData.userId;
          console.log('[Gmail Callback] ✅ Retrieved userId from state parameter:', stateData.userId?.substring(0, 20) || 'unknown');
        } else {
          // Fallback: if state is just the userId (for backwards compatibility)
          if (!userId && state.length > 10 && !state.includes('{')) {
            userId = state;
            console.log('[Gmail Callback] ✅ Using state as userId directly (fallback)');
          }
        }
      } catch (error) {
        console.warn('[Gmail Callback] Failed to parse state parameter:', error);
        // Fallback: if state looks like a userId, use it directly
        if (state && state.length > 10 && !state.includes('{')) {
          userId = state;
          console.log('[Gmail Callback] ✅ Using state as userId directly (error fallback)');
        }
      }
    }

    // Fallback to Clerk authentication (for web OAuth)
    if (!userId) {
      try {
        const { auth } = await import("@clerk/nextjs/server");
        const authResult = await auth();
        userId = authResult?.userId || null;
        if (userId) {
          console.log('[Gmail Callback] Retrieved userId from Clerk session:', userId.substring(0, 20));
        }
      } catch (error) {
        // Clerk not available or not configured
      }
    }

    if (!userId) {
      console.warn('[Gmail Callback] No userId available - tokens will be stored in cookie only');
      // For mobile requests, this is a critical failure as they can't access cookies
      // We must have a userId to persist tokens to DB
      const userAgent = request.headers.get('user-agent') || '';
      const isMobileRequest = state || /Mobile|Android|iPhone|iPad/i.test(userAgent);

      if (isMobileRequest) {
        console.error('[Gmail Callback] ❌ Mobile request missing userId - cannot persist tokens');
        const deepLinkFailure = 'dealanalyzer://gmail-callback?success=false&reason=user_id_missing_in_callback';
        return NextResponse.redirect(deepLinkFailure, 302);
      }
    }

    // Determine the redirect URI that was used (must match the one in auth URL)
    const callbackUrlForRedirect = new URL(request.url);
    const forwardedProtoForRedirect = request.headers.get('x-forwarded-proto');
    const hostForRedirect = request.headers.get('host') || callbackUrlForRedirect.hostname;
    const protocolForRedirect = forwardedProtoForRedirect || (callbackUrlForRedirect.protocol.replace(':', '') || 'https');
    const redirectUri = `${protocolForRedirect}://${hostForRedirect}/api/gmail-callback`;

    console.log('[Gmail Callback] Processing OAuth callback', {
      hasCode: !!code,
      hasState: !!state,
      hasUserId: !!userId,
      codeLength: code?.length,
      redirectUri,
      requestUrl: request.url,
      fullUrl: request.url,
    });

    // Log the exact redirect URI being used
    console.log('[Gmail Callback] Using redirect URI:', redirectUri);
    console.log('[Gmail Callback] This must match the redirect URI used in the auth URL');

    let tokens;
    try {
      // Use the same redirect URI that was used in the auth URL
      // We need to pass it to getTokens to ensure it matches
      const clientId = process.env.GMAIL_CLIENT_ID;
      const clientSecret = process.env.GMAIL_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error('Gmail OAuth credentials not configured');
      }

      const { google } = await import('googleapis');
      const auth = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri // Must match the redirect URI used in the auth URL
      );

      const tokenResponse = await auth.getToken(code);
      tokens = tokenResponse.tokens;
      console.log('[Gmail Callback] Successfully exchanged code for tokens', {
        hasAccessToken: !!tokens?.access_token,
        hasRefreshToken: !!tokens?.refresh_token,
        tokenType: tokens?.token_type,
      });
    } catch (error: any) {
      console.error('[Gmail Callback] Error exchanging code for tokens:', error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to exchange authorization code for tokens",
          details: error.message
        },
        { status: 500 }
      );
    }

    if (!tokens || !tokens.access_token) {
      console.error('[Gmail Callback] No tokens received from Google');
      return NextResponse.json(
        { success: false, error: "No tokens received from Google" },
        { status: 500 }
      );
    }

    console.log('[Gmail Callback] Received tokens, setting cookie...');

    // Preserve existing refresh token if Google doesn't return one (common on re-auth)
    let refreshToken = tokens.refresh_token || '';
    let existingTokens: {
      access_token?: string;
      refresh_token?: string;
      scope?: string;
      token_type?: string;
      expiry_date?: number;
    } | null = null;

    const existingCookie = request.cookies.get('gmailTokens');
    if (!refreshToken && existingCookie?.value) {
      try {
        existingTokens = JSON.parse(existingCookie.value);
        refreshToken = existingTokens?.refresh_token || refreshToken;
      } catch (error) {
        console.error('[Gmail Callback] Error parsing existing cookie tokens:', error);
      }
    }

    if (!refreshToken && userId && process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

        const dbTokens = await convexClient.action(
          apiModule.api.userOAuthTokens.retrieveTokensForServer,
          { userId }
        );

        if (dbTokens?.refreshToken) {
          refreshToken = dbTokens.refreshToken;
          existingTokens = {
            refresh_token: dbTokens.refreshToken,
            access_token: dbTokens.accessToken,
            scope: dbTokens.scope,
            token_type: dbTokens.tokenType,
            expiry_date: dbTokens.expiryDate,
          };
          console.log('[Gmail Callback] Retrieved refresh token from database');
        }
      } catch (error) {
        console.error('[Gmail Callback] Error retrieving refresh token from database:', error);
      }
    }

    // Determine if this was a mobile request before proceeding
    const userAgent = request.headers.get('user-agent') || '';
    const isMobileRequest = state || /Mobile|Android|iPhone|iPad/i.test(userAgent);

    // If we still don't have a refresh token, fail fast so mobile knows to retry with consent
    if (!refreshToken) {
      console.error('[Gmail Callback] ❌ No refresh token available after token exchange and lookup.');
      const deepLinkFailure = 'dealanalyzer://gmail-callback?success=false&reason=no_refresh_token_received';
      if (isMobileRequest) {
        return NextResponse.redirect(deepLinkFailure, 302);
      }
      return NextResponse.json(
        { success: false, error: 'No refresh token received. Please reconnect Gmail and allow consent.' },
        { status: 400 }
      );
    }

    // Store tokens in cookie
    const cookieStore = await cookies();
    const isHttps = forwardedProtoForRedirect
      ? forwardedProtoForRedirect === 'https'
      : callbackUrlForRedirect.protocol === 'https:';
    const isDevelopment = process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1';
    const useSecureCookies = !isDevelopment && isHttps;
    const tokenData = {
      access_token: tokens.access_token || '',
      refresh_token: refreshToken,
      scope: tokens.scope || existingTokens?.scope || '',
      token_type: tokens.token_type || existingTokens?.token_type || 'Bearer',
      expiry_date: tokens.expiry_date ?? existingTokens?.expiry_date ?? undefined
    };

    cookieStore.set('gmailTokens', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: useSecureCookies,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/', // Ensure cookie is available across the entire domain
    });

    console.log('[Gmail Callback] Cookie set successfully');

    // Persist tokens to database if userId is available and we have both tokens
    let persistenceSuccess = true;
    let persistenceError = null;

    if (userId && tokens.access_token && hasRefreshToken) {
      try {
        console.log('[Gmail Callback] Attempting to persist tokens for user:', userId);
        // Initialize Convex client for token persistence
        if (process.env.NEXT_PUBLIC_CONVEX_URL) {
          const { ConvexHttpClient } = await import('convex/browser');
          const apiModule = await import('../../../convex/_generated/api');
          const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

          console.log('[Gmail Callback] Convex Client initialized with URL:', process.env.NEXT_PUBLIC_CONVEX_URL?.substring(0, 30) + '...');

          const tokenStoredId = await convexClient.mutation(apiModule.api.userOAuthTokens.upsertTokens, {
            userId,
            accessToken: tokens.access_token,
            refreshToken,
            scope: tokens.scope || existingTokens?.scope,
            expiryDate: tokens.expiry_date ?? existingTokens?.expiry_date ?? undefined,
            tokenType: tokens.token_type || existingTokens?.token_type || 'Bearer',
          });

          if (tokenStoredId) {
            console.log(`[Gmail Callback] ✅ Tokens stored in database for user ${userId}, ID: ${tokenStoredId}`);
          } else {
            console.warn(`[Gmail Callback] ⚠️ Token storage returned null ID for user ${userId}`);
            // This might happen if the mutation doesn't return anything or there's an issue
          }
        } else {
          console.error('[Gmail Callback] ❌ NEXT_PUBLIC_CONVEX_URL is not configured - CANNOT PERSIST TOKENS');
          persistenceSuccess = false;
          persistenceError = 'convex_url_missing';
        }
      } catch (error: any) {
        persistenceSuccess = false;
        persistenceError = error?.message || 'convex_mutation_failed';
        console.error('[Gmail Callback] ❌ Error persisting tokens to database:', error);
        console.error('[Gmail Callback] Mutation details:', {
          userId: userId?.substring(0, 10),
          hasAccessToken: !!tokens.access_token,
          hasRefreshToken: !!refreshToken,
          error: error?.message,
          stack: error?.stack
        });
      }
    } else {
      console.warn('[Gmail Callback] ⚠️ Skipping persistence - missing requirements:', {
        hasUserId: !!userId,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!hasRefreshToken
      });
      if (isMobileRequest) {
        persistenceSuccess = false;
        persistenceError = !userId ? 'user_id_missing' : 'tokens_missing';
      }
    }

    // Verify cookie was set
    const verifyGmailTokensCookie = cookieStore.get('gmailTokens');
    console.log('[Gmail Callback] Cookie verification:', {
      cookieSet: !!verifyGmailTokensCookie,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
      userIdSet: !!userId,
    });

    // Log successful token exchange and storage
    console.log('[Gmail Callback] ✅ SUCCESS - Tokens stored and ready', {
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!refreshToken,
      userId: userId ? userId.substring(0, 20) + '...' : 'none',
      timestamp: new Date().toISOString(),
    });
    console.log('═══════════════════════════════════════════════════════════');
    console.log('');

    console.log('[Gmail Callback] Determining response type:', {
      isMobileRequest,
      hasState: !!state,
      userAgent: userAgent.substring(0, 100),
    });

    // For mobile OAuth, redirect directly to the app using deep link (HTTP 302)
    // This is more reliable than JavaScript redirect for in-app browsers
    if (isMobileRequest) {
      let deepLink = 'dealanalyzer://gmail-callback?success=true';
      if (!persistenceSuccess) {
        deepLink = `dealanalyzer://gmail-callback?success=false&reason=persistence_failed&details=${encodeURIComponent(persistenceError || 'unknown')}`;
        console.error('[Gmail Callback] Redirecting to failure deep link:', deepLink);
      } else {
        console.log('[Gmail Callback] Redirecting to success deep link:', deepLink);
      }

      return NextResponse.redirect(deepLink, 302);
    }

    // For web OAuth, return a success page that closes the popup
    // The main window is already polling for connection status, so we just close this popup
    return new NextResponse(
      `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Gmail Connected</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            margin: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .container {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 1rem;
            backdrop-filter: blur(10px);
          }
          .checkmark {
            font-size: 4rem;
            margin-bottom: 1rem;
            animation: scaleIn 0.5s ease-in-out;
          }
          @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
          }
          h1 { margin: 0 0 0.5rem 0; }
          p { margin: 0; opacity: 0.9; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="checkmark">✓</div>
          <h1>Gmail Connected Successfully!</h1>
          <p>Redirecting back to app...</p>
          <button id="redirectBtn" onclick="redirectToApp()" style="
            margin-top: 1rem;
            padding: 0.75rem 1.5rem;
            background: white;
            color: #667eea;
            border: none;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
          ">Return to App</button>
        </div>
        <script>
          const deepLink = 'dealanalyzer://gmail-callback?success=true';
          const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
          
          function redirectToApp() {
            console.log('Redirecting to app:', deepLink);
            
            // Try multiple methods to ensure redirect works
            // Method 1: Direct location change (most reliable)
            window.location.href = deepLink;
            
            // Method 2: Try window.open as fallback
            setTimeout(() => {
              try {
                window.open(deepLink, '_self');
              } catch (e) {
                console.log('window.open failed');
              }
            }, 300);
            
            // Method 3: Try iframe method (for some browsers)
            setTimeout(() => {
              try {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = deepLink;
                document.body.appendChild(iframe);
                setTimeout(() => {
                  if (iframe.parentNode) {
                    document.body.removeChild(iframe);
                  }
                }, 1000);
              } catch (e) {
                console.log('iframe method failed');
              }
            }, 600);
            
            // Try to close window after redirect
            setTimeout(() => {
              try {
                window.close();
              } catch (e) {
                console.log('Cannot close window (browser may block this)');
              }
            }, 2000);
          }
          
          // Auto-redirect immediately
          redirectToApp();
          
          // Also redirect on any click/touch
          document.addEventListener('click', redirectToApp);
          document.addEventListener('touchstart', redirectToApp);
          
          // Make the button work
          const btn = document.getElementById('redirectBtn');
          if (btn) {
            btn.onclick = redirectToApp;
          }
        </script>
      </body>
    </html>
    `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error: any) {
    console.error("[Gmail Callback] ❌ Unhandled error in callback:", error);
    console.error("[Gmail Callback] Error details:", {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
    });

    // Return more detailed error for debugging (in production, you might want to hide details)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to complete Gmail authorization",
        details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
        hint: "Check server logs for more details. Common issues: missing env vars, redirect URI mismatch, or code already used."
      },
      { status: 500 }
    );
  }
}

