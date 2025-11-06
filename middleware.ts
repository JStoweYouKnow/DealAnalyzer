import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
// Authentication is currently disabled - all routes are public
const isPublicRoute = createRouteMatcher([
  '/',
  '/deals',
  '/market',
  '/search',
  '/comparison',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/health',
  '/api/gmail-callback', // OAuth callback must be public
  '/api/(.*)', // All API routes are public
]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  // Allow public routes through without authentication
  if (isPublicRoute(request)) {
    return NextResponse.next();
  }

  // Authentication is currently disabled - allow all routes through
  // If you want to re-enable authentication, uncomment the code below:
  /*
  // Protect all other routes
  const { userId } = await auth();
  
  if (!userId) {
    // Redirect to sign-in for protected routes
    const signInUrl = new URL('/sign-in', request.url);
    signInUrl.searchParams.set('redirect_url', request.url);
    return NextResponse.redirect(signInUrl);
  }
  */

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
