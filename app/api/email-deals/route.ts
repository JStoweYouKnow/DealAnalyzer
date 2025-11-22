import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "../../../server/storage";
import { logger } from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    logger.info("Getting email deals from storage");

    // Check if Convex is configured
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      logger.warn("NEXT_PUBLIC_CONVEX_URL not configured. Returning empty email deals array.");
      return NextResponse.json([]);
    }

    // Get userId from Clerk auth (in production) or fallback to session header (in development)
    const { userId: clerkUserId } = await auth();
    const isDev = process.env.NODE_ENV === 'development';
    let userId = clerkUserId;
    if (!userId && isDev) {
      const headerUserId = request.headers.get('x-user-session-id');
      if (headerUserId && headerUserId !== 'temp-ssr-id') {
        logger.info("Development fallback: using x-user-session-id from request headers", {
          userId: headerUserId.substring(0, 20),
        });
        userId = headerUserId;
      }
    }
    if (!userId || userId === 'temp-ssr-id') {
      if (!isDev) {
        logger.warn("Unauthorized: Missing Clerk userId in production");
      } else {
        logger.warn("Unauthorized in development: No valid Clerk userId and no valid x-user-session-id header");
      }
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const requestLogger = logger.withContext({ userId: userId.substring(0, 20) });
    requestLogger.info("Fetching email deals for user");
    const emailDeals = await storage.getEmailDeals();
    requestLogger.info(`Retrieved ${emailDeals.length} email deals for user`, {
      count: emailDeals.length,
    });
    return NextResponse.json(emailDeals);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error("Error getting email deals", error instanceof Error ? error : undefined, {
      errorMessage,
    });

    // Check if the error is related to Convex initialization
    if (errorMessage.includes('CONVEX') || errorMessage.includes('Convex')) {
      logger.warn("Convex storage not available. Returning empty array. Make sure NEXT_PUBLIC_CONVEX_URL is set and Convex is deployed.");
      return NextResponse.json([]);
    }

    // For other errors, return 500 with details
    return NextResponse.json(
      { error: `Failed to get email deals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

