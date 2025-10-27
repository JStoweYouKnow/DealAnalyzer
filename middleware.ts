// Authentication disabled - to re-enable, uncomment the lines below
// import { clerkMiddleware } from "@clerk/nextjs/server";
// export default clerkMiddleware();

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// No-op middleware - allows all requests through without authentication
export function middleware(request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
