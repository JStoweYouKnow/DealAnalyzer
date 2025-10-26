import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const live = searchParams.get('live');
    
    let trends;
    
    // Try to get live data first if requested
    if (live === 'true' && city && state) {
      try {
        trends = await rentCastAPI.getNeighborhoodTrends(city as string, state as string);
        if (trends.length === 0) {
          // Fall back to stored data if API returns no results
          trends = await storage.getNeighborhoodTrends(city as string, state as string);
        }
      } catch (apiError) {
        console.warn("RentCast API failed, falling back to stored data:", apiError);
        trends = await storage.getNeighborhoodTrends(city as string, state as string);
      }
    } else {
      // Use stored data by default
      trends = await storage.getNeighborhoodTrends(
        city as string | undefined,
        state as string | undefined
      );
    }
    
    return NextResponse.json({ success: true, data: trends });
  } catch (error) {
    console.error("Error fetching neighborhood trends:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch neighborhood trends" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trend = await storage.createNeighborhoodTrend(body);
    return NextResponse.json({ success: true, data: trend });
  } catch (error) {
    console.error("Error creating neighborhood trend:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create neighborhood trend" },
      { status: 400 }
    );
  }
}

