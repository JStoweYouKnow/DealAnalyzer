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

    console.log('[Gmail Callback] Received tokens, setting cookie...');

    // Store tokens in cookie
    const cookieStore = await cookies();
    const tokenData = {
      access_token: tokens.access_token || '',
      refresh_token: tokens.refresh_token || '',
      scope: tokens.scope || '',
      token_type: tokens.token_type || 'Bearer',
      expiry_date: tokens.expiry_date || undefined
    };

    cookieStore.set('gmailTokens', JSON.stringify(tokenData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/', // Ensure cookie is available across the entire domain
    });

    console.log('[Gmail Callback] Cookie set successfully');

    // Verify cookie was set
    const verifyGmailTokensCookie = cookieStore.get('gmailTokens');
    console.log('[Gmail Callback] Cookie verification:', {
      cookieSet: !!verifyGmailTokensCookie,
      hasAccessToken: !!tokens.access_token,
      hasRefreshToken: !!tokens.refresh_token,
    });
    
  // Return a success page that closes the popup
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
          <p>This window will close automatically...</p>
        </div>
        <script>
          // Notify parent window that auth is complete
          if (window.opener && !window.opener.closed) {
            try {
              window.opener.postMessage({ type: 'GMAIL_AUTH_SUCCESS' }, window.location.origin);
              console.log('Notified parent window of successful auth');
            } catch (error) {
              console.error('Error notifying parent:', error);
            }
          }

          // Close this popup window after a short delay
          setTimeout(() => {
            window.close();
          }, 2000);
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
  } catch (error) {
    console.error("Error in Gmail callback:", error);
    return NextResponse.json(
      { success: false, error: "Failed to complete Gmail authorization" },
      { status: 500 }
    );
  }
}

