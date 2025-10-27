import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import { getCurrentUserId } from "../../lib/clerk-helpers";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const emailDeals = await storage.getEmailDeals();
    return NextResponse.json(emailDeals);
  } catch (error) {
    console.error("Error getting email deals:", error);
    return NextResponse.json(
      { error: "Failed to get email deals" },
      { status: 500 }
    );
  }
}

