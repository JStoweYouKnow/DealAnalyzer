import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../../server/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Get existing deal to verify it exists
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    // Update the email deal status to archived
    const updatedDeal = await storage.updateEmailDeal(id, { status: 'archived' });
    
    if (!updatedDeal) {
      return NextResponse.json(
        { error: "Failed to archive email deal" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: updatedDeal,
      message: "Email deal archived successfully"
    });
  } catch (error) {
    console.error("Error archiving email deal:", error);
    return NextResponse.json(
      { error: "Failed to archive email deal" },
      { status: 500 }
    );
  }
}
