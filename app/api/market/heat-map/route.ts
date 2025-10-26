import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const north = searchParams.get('north');
    const south = searchParams.get('south');
    const east = searchParams.get('east');
    const west = searchParams.get('west');
    const live = searchParams.get('live');
    
    const bounds = (north && south && east && west) ? {
      north: Number(north),
      south: Number(south),
      east: Number(east),
      west: Number(west)
    } : undefined;
    
    let heatMapData;
    
    // Try to get live data first if requested
    if (live === 'true') {
      try {
        // Get popular zip codes for live data
        const popularZipCodes = ['90210', '78701', '33139', '10001', '94110', '37203', '85001', '30309', '80202', '02101'];
        heatMapData = await rentCastAPI.getMarketHeatMapData(popularZipCodes);
        if (heatMapData.length === 0) {
          // Fall back to stored data if API returns no results
          heatMapData = await storage.getMarketHeatMapData(bounds);
        }
      } catch (apiError) {
        console.warn("RentCast API failed, falling back to stored data:", apiError);
        heatMapData = await storage.getMarketHeatMapData(bounds);
      }
    } else {
      // Use stored data by default
      heatMapData = await storage.getMarketHeatMapData(bounds);
    }
    
    return NextResponse.json({ success: true, data: heatMapData });
  } catch (error) {
    console.error("Error fetching heat map data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch heat map data" },
      { status: 500 }
    );
  }
}

