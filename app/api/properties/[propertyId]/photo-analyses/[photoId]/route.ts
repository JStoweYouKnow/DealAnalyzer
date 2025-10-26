import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../../../server/storage";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { propertyId: string; photoId: string } }
) {
  try {
    const { photoId } = params;
    const deleted = await storage.deletePhotoAnalysis(photoId);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Photo analysis not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting photo analysis:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete photo analysis" },
      { status: 500 }
    );
  }
}

