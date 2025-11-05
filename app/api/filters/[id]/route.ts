import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { insertSavedFilterSchema } from "@shared/schema";
import { ZodError } from "zod";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates = insertSavedFilterSchema.partial().parse(body);
    const filter = await storage.updateSavedFilter(id, updates);
    
    if (!filter) {
      return NextResponse.json(
        { success: false, error: "Filter not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: filter });
  } catch (error) {
    console.error("Error updating saved filter:", error);
    if (error instanceof ZodError || (error as any)?.name === "ZodError") {
      const zodError = error instanceof ZodError 
        ? error 
        : error as ZodError;
      return NextResponse.json(
        { success: false, error: zodError.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Failed to update saved filter" },
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
    const deleted = await storage.deleteSavedFilter(id);
    
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Filter not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved filter:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete saved filter" },
      { status: 500 }
    );
  }
}

