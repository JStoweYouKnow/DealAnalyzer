import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: { propertyId: string } }
) {
  try {
    const { propertyId } = params;
    const analyses = await storage.getPhotoAnalyses(propertyId);
    return NextResponse.json({ success: true, data: analyses });
  } catch (error) {
    console.error("Error fetching photo analyses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch photo analyses" },
      { status: 500 }
    );
  }
}

