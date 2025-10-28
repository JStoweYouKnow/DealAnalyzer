import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";

export async function GET() {
  try {
    // No authentication check since we removed Clerk
    const emailDeals = await storage.getEmailDeals();
    return NextResponse.json(emailDeals);
  } catch (error) {
    console.error("Error getting email deals:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Failed to get email deals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

