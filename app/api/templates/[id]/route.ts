import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { insertAnalysisTemplateSchema } from "@shared/schema";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await storage.getAnalysisTemplate(id);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Error fetching template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch template" },
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
    const body = await request.json();
    const updates = insertAnalysisTemplateSchema.partial().parse(body);
    const template = await storage.updateAnalysisTemplate(id, updates);
    
    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: template });
  } catch (error) {
    console.error("Error updating template:", error);
    // Zod validation errors should return 400
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Invalid request data" },
        { status: 400 }
      );
    }
    // Storage/server errors should return 500
    return NextResponse.json(
      { success: false, error: "Failed to update template" },
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
    const success = await storage.deleteAnalysisTemplate(id);
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: "Template not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting template:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete template" },
      { status: 500 }
    );
  }
}






