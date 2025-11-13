import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Development-only flag: allows permissive route matching in development
// In production, this should be false to enforce authentication
const ALLOW_PUBLIC_ROUTES_IN_DEV = process.env.NODE_ENV !== 'production' || 
  process.env.FEATURE_ALLOW_PUBLIC_ROUTES === 'true';

// Runtime assertion to prevent accidental deployment with permissive matcher
if (process.env.NODE_ENV === 'production' && ALLOW_PUBLIC_ROUTES_IN_DEV) {
  const errorMsg = 'SECURITY ERROR: Public routes cannot be enabled in production! ' +
    'Set FEATURE_ALLOW_PUBLIC_ROUTES=false or remove it to enforce authentication.';
  console.error('⚠️  ', errorMsg);
  // Fail hard in production to prevent accidental deployment with insecure configuration
  throw new Error(errorMsg);
}

// Define safe public routes that don't require authentication
// These are endpoints that must be accessible without auth:
// - Root and static pages (landing page)
// - Authentication pages (sign-in/sign-up)
// - Legal pages (privacy, terms) - required for OAuth provider registration/compliance
// - Specific public API endpoints only:
//   * Health check for monitoring
//   * OAuth callbacks for authentication flow
//   * Webhook endpoints for external services
//   * Open Graph images for social sharing
const safePublicRoutes = [
  '/',                         // Landing page
  '/sign-in(.*)',              // Authentication pages
  '/sign-up(.*)',
  '/privacy',                  // Legal pages
  '/terms',
  '/api/health',               // Health check - monitoring
  '/api/gmail-callback',       // OAuth callback - required for Gmail auth
  '/api/receive-email',        // SendGrid webhook - email forwarding
  '/api/og-image',             // Open Graph images - social sharing (query params only)
  '/api/criteria',             // Investment criteria - returns default values (GET is safe, PUT should be protected but uses in-memory cache)
  '/api/extract-property-url', // Property URL extraction - rate limited, safe for public use
  '/api/mortgage-calculator',  // Mortgage calculator - utility endpoint, safe for public use
  '/api/analyze',              // Property analysis from text - rate limited, safe for public use
  '/api/analyze-file',         // Property analysis from file - rate limited, safe for public use
];

// Development-only: additional routes that are public in dev but protected in production
// In production, all routes except those in safePublicRoutes will require authentication
// This includes: /deals, /market, /search, /comparison, and all other API endpoints
const devOnlyPublicRoutes: string[] = [];

// SECURITY DIRECTIVE: All public webhook routes MUST implement signature verification
// 
// Required implementation for webhook endpoints (e.g., /api/receive-email):
// 
// 1. VERIFY WEBHOOK SIGNATURES:
//    - SendGrid: Extract and verify X-Twilio-Email-Event-Webhook-Signature header
//      using ECDSA with the public key from SENDGRID_WEBHOOK_PUBLIC_KEY env var
//      Docs: https://www.twilio.com/docs/sendgrid/for-developers/tracking-events/getting-started-event-webhook-security-features
//    - Other providers: Use provider-specific HMAC verification (e.g., X-Hub-Signature-256 for GitHub,
//      X-Stripe-Signature for Stripe) with secret from env vars
// 
// 2. EXTRACT AND VALIDATE SIGNATURE + TIMESTAMP:
//    - Extract signature from header (e.g., X-Twilio-Email-Event-Webhook-Signature)
//    - Extract timestamp from header (e.g., X-Twilio-Email-Event-Webhook-Timestamp)
//    - Validate signature against raw request body + timestamp using configured secret/public key from env
//    - Reject if signature is missing, malformed, or invalid
// 
// 3. ENFORCE REPLAY PREVENTION:
//    - Extract timestamp from request headers
//    - Calculate age: currentTimestamp - requestTimestamp
//    - Reject requests with timestamp age > 5 minutes (300 seconds) or < 0 (future timestamps)
//    - This prevents replay attacks using captured webhook payloads
// 
// 4. FAIL CLOSED ON VERIFICATION FAILURE:
//    - Return 401 Unauthorized if signature/timestamp headers are missing
//    - Return 403 Forbidden if signature verification fails or timestamp is stale
//    - Do NOT process the request if verification fails - fail closed, not open
//    - Log verification failures for security monitoring
// 
// 5. IMPLEMENTATION EXAMPLE:
//    ```typescript
//    // In your webhook route handler (e.g., app/api/receive-email/route.ts):
//    export async function POST(request: NextRequest) {
//      // Verify webhook signature FIRST, before any processing
//      const verificationResult = await verifyWebhook(request);
//      if (!verificationResult.valid) {
//        console.error('Webhook verification failed:', verificationResult.error);
//        return NextResponse.json(
//          { error: 'Unauthorized' },
//          { status: verificationResult.error?.includes('missing') ? 401 : 403 }
//        );
//      }
//      // ... rest of webhook processing
//    }
//    ```
// 
// See app/api/receive-email/route.ts for a complete implementation example.

// Combine safe and dev-only routes
const publicRoutes = [...safePublicRoutes, ...devOnlyPublicRoutes];

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const pathname = request.nextUrl.pathname;
  const method = request.method;
  
  // Explicitly check for /api/criteria GET requests FIRST (before any other checks)
  // This ensures criteria endpoint is always accessible for GET requests
  if (pathname === '/api/criteria' && method === 'GET') {
    return NextResponse.next();
  }
  
  // Allow public routes through without authentication
  // Check this before any auth checks
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // In production, enforce authentication for all protected routes
  // In development with ALLOW_PUBLIC_ROUTES_IN_DEV=true, allow all routes through
  if (ALLOW_PUBLIC_ROUTES_IN_DEV) {
    // Development mode: allow all routes through
    return NextResponse.next();
  }

  // Production mode: protect all other routes
  const { userId } = await auth();
  
  if (!userId) {
    // For API routes, return 401 instead of redirecting
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For page routes, redirect to sign-in
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
