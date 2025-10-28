import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";

export async function GET() {
  try {
    console.log("Getting email deals from storage...");
    // No authentication check since we removed Clerk
    const emailDeals = await storage.getEmailDeals();
    console.log(`Retrieved ${emailDeals.length} email deals`);
    return NextResponse.json(emailDeals);
  } catch (error) {
    console.error("Error getting email deals:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error stack:", errorStack);
    return NextResponse.json(
      { error: `Failed to get email deals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

