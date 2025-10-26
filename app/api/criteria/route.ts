import { NextResponse } from "next/server";
import { loadInvestmentCriteria, updateInvestmentCriteria } from "../../../server/services/criteria-service";
import { updateCriteriaRequestSchema } from "../../../shared/schema";

export async function GET() {
  try {
    const criteria = await loadInvestmentCriteria();
    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Error loading criteria:", error);
    return NextResponse.json(
      { error: "Failed to load investment criteria" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const validation = updateCriteriaRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid criteria: " + validation.error.errors.map((e: any) => e.message).join(", ")
        },
        { status: 400 }
      );
    }

    const { criteria } = validation.data;
    
    // Update criteria in Python backend
    const result = await updateInvestmentCriteria(criteria);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "Failed to update criteria" },
        { status: 400 }
      );
    }

    // Return updated criteria
    const updatedCriteria = await loadInvestmentCriteria();
    
    return NextResponse.json({
      success: true,
      data: updatedCriteria
    });
  } catch (error) {
    console.error("Error updating criteria:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during criteria update" },
      { status: 500 }
    );
  }
}
