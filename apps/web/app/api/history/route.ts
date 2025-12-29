import { NextResponse } from "next/server";
import { storage } from "../../../server/storage";

export async function GET() {
  try {
    const history = await storage.getAnalysisHistory();
    return NextResponse.json(history);
  } catch (error) {
    console.error("Error getting history:", error);
    return NextResponse.json(
      { error: "Failed to get analysis history" },
      { status: 500 }
    );
  }
}

