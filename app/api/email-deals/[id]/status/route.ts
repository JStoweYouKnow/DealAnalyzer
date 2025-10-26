import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../../server/storage";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }
    
    // Validate status values
    const validStatuses = ['pending', 'analyzed', 'interested', 'not_interested', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Get existing deal to verify it exists
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    // Update only the status
    const updatedDeal = await storage.updateEmailDeal(id, { status });
    
    return NextResponse.json({
      success: true,
      data: updatedDeal
    });
  } catch (error) {
    console.error("Error updating email deal status:", error);
    return NextResponse.json(
      { error: "Failed to update email deal status" },
      { status: 500 }
    );
  }
}
