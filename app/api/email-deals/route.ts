import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "../../../server/storage";

export async function GET(request: NextRequest) {
  try {
    console.log("Getting email deals from storage...");

    // Check if Convex is configured
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.warn("NEXT_PUBLIC_CONVEX_URL not configured. Returning empty email deals array.");
      return NextResponse.json([]);
    }

    // Get userId from Clerk auth (in production) or fallback to session header (in development)
    const { userId: clerkUserId } = await auth();
    const isDev = process.env.NODE_ENV === 'development';
    let userId = clerkUserId;
    if (!userId && isDev) {
      const headerUserId = request.headers.get('x-user-session-id');
      if (headerUserId && headerUserId !== 'temp-ssr-id') {
        console.log("Development fallback: using x-user-session-id from request headers.");
        userId = headerUserId;
      }
    }
    if (!userId || userId === 'temp-ssr-id') {
      if (!isDev) {
        console.warn("Unauthorized: Missing Clerk userId in production.");
      } else {
        console.warn("Unauthorized in development: No valid Clerk userId and no valid x-user-session-id header.");
      }
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    console.log(`Fetching email deals for user: ${userId.substring(0, 20)}...`);
    const emailDeals = await storage.getEmailDeals(userId);
    console.log(`Retrieved ${emailDeals.length} email deals for user`);
    return NextResponse.json(emailDeals);
  } catch (error) {
    console.error("Error getting email deals:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);

    // Check if the error is related to Convex initialization
    if (errorMessage.includes('CONVEX') || errorMessage.includes('Convex')) {
      console.warn("Convex storage not available. Returning empty array. Make sure NEXT_PUBLIC_CONVEX_URL is set and Convex is deployed.");
      return NextResponse.json([]);
    }

    // For other errors, return 500 with details
    return NextResponse.json(
      { error: `Failed to get email deals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

