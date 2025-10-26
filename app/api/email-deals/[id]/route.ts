import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const emailDeal = await storage.getEmailDeal(id);
    
    if (!emailDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(emailDeal);
  } catch (error) {
    console.error("Error getting email deal:", error);
    return NextResponse.json(
      { error: "Failed to get email deal" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updates = await request.json();
    
    // Get existing deal to verify it exists
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      // Debug: Let's see what email deals exist
      const allDeals = await storage.getEmailDeals();
      console.log(`PUT /api/email-deals/${id} - Deal not found!`);
      console.log(`Total deals in storage: ${allDeals.length}`);
      console.log('Available email deal IDs:', allDeals.slice(0, 5).map(d => `${d.id} (${d.subject?.substring(0, 30)}...)`));
      
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    // Update the email deal
    const updatedDeal = await storage.updateEmailDeal(id, updates);
    
    return NextResponse.json({
      success: true,
      data: updatedDeal
    });
  } catch (error) {
    console.error("Error updating email deal:", error);
    return NextResponse.json(
      { error: "Failed to update email deal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify deal exists before deleting
    const existingDeal = await storage.getEmailDeal(id);
    if (!existingDeal) {
      return NextResponse.json(
        { error: "Email deal not found" },
        { status: 404 }
      );
    }
    
    await storage.deleteEmailDeal(id);
    
    return NextResponse.json({
      success: true,
      message: "Email deal deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting email deal:", error);
    return NextResponse.json(
      { error: "Failed to delete email deal" },
      { status: 500 }
    );
  }
}
