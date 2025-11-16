import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../server/storage";
import type { DealAnalysis } from "../../../shared/schema";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const analysis: DealAnalysis | undefined = body?.analysis;

    if (!analysis || typeof analysis !== 'object') {
      return NextResponse.json(
        { success: false, error: "Invalid request: analysis is required" },
        { status: 400 }
      );
    }

    // If an id is provided, try to update; otherwise create
    const hasId = Boolean((analysis as any).id);
    let stored;
    if (hasId) {
      stored = await storage.updateDealAnalysis((analysis as any).id, analysis as any);
      if (!stored) {
        // If update failed (id not found), create instead
        stored = await storage.createDealAnalysis(analysis as any);
      }
    } else {
      stored = await storage.createDealAnalysis(analysis as any);
    }

    return NextResponse.json({
      success: true,
      data: stored,
    });
  } catch (error) {
    console.error("Error in persist-analysis endpoint:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during analysis persistence" },
      { status: 500 }
    );
  }
}


