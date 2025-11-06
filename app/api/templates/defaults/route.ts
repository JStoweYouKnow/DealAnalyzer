import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";

export async function GET(request: NextRequest) {
  try {
    const templates = await storage.getDefaultTemplates();
    return NextResponse.json({ success: true, data: templates });
  } catch (error) {
    console.error("Error fetching default templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch default templates" },
      { status: 500 }
    );
  }
}






