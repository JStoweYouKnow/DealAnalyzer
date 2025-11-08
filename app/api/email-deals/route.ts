import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";

export async function GET() {
  try {
    console.log("Getting email deals from storage...");

    // Check if Convex is configured
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      console.warn("NEXT_PUBLIC_CONVEX_URL not configured. Returning empty email deals array.");
      return NextResponse.json([]);
    }

    // No authentication check since we removed Clerk
    const emailDeals = await storage.getEmailDeals();
    console.log(`Retrieved ${emailDeals.length} email deals`);
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

