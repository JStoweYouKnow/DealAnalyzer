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
// - Legal pages (privacy, terms) - required for OAuth verification
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
  '/api/og-image(.*)',         // Open Graph images - social sharing
];

// Development-only: additional routes that are public in dev but protected in production
// In production, all routes except those in safePublicRoutes will require authentication
// This includes: /deals, /market, /search, /comparison, and all other API endpoints
const devOnlyPublicRoutes: string[] = [];

// SECURITY NOTE: Public webhooks (e.g., /api/receive-email) should implement their own
// authentication/verification mechanisms (e.g., SendGrid signature verification)

// Combine safe and dev-only routes
const publicRoutes = [...safePublicRoutes, ...devOnlyPublicRoutes];

const isPublicRoute = createRouteMatcher(publicRoutes);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Allow public routes through without authentication
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
    // Redirect to sign-in for protected routes
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
