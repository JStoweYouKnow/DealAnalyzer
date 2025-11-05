import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../../server/storage";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const filter = await storage.getSavedFilter(id);
    
    if (!filter) {
      return NextResponse.json(
        { success: false, error: "Filter not found" },
        { status: 404 }
      );
    }
    
    // Search properties using filter criteria
    const results = await storage.searchProperties(filter.filterCriteria);
    
    // Increment usage count only after successful search
    await storage.incrementFilterUsage(id);
    
    return NextResponse.json({ 
      success: true, 
      data: {
        filter,
        results
      }
    });
  } catch (error) {
    console.error("Error using saved filter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to use saved filter" },
      { status: 500 }
    );
  }
}

