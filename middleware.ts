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
// - Root and static pages
// - Authentication pages (sign-in/sign-up)
// - Health check endpoint
// - OAuth callbacks (required for OAuth flow)
const safePublicRoutes = [
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/gmail-callback', // OAuth callback must be public
  '/api/gmail-auth-url', // OAuth initiation must be public
  '/api/cron/weekly-digest', // Cron endpoint (has its own CRON_SECRET auth)
];

// Development-only: permissive routes for testing
// These routes should be protected in production
const devOnlyPublicRoutes = ALLOW_PUBLIC_ROUTES_IN_DEV ? [
  '/deals',
  '/market',
  '/search',
  '/comparison',
] : [];

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
