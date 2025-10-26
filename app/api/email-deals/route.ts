import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";

export async function GET() {
  try {
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

