import { NextRequest, NextResponse } from "next/server";
import { storage } from "../../../../server/storage";
import { rentCastAPI } from "../../../../server/services/rentcast-api";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');
    const radius = searchParams.get('radius');
    const live = searchParams.get('live');
    
    if (!address) {
      return NextResponse.json(
        { success: false, error: "Address is required" },
        { status: 400 }
      );
    }
    
    let sales;
    
    // Try to get live data first if requested
    if (live === 'true') {
      try {
        sales = await rentCastAPI.getComparableSales(
          address as string,
          radius ? Number(radius) : 1
        );
        if (sales.length === 0) {
          // Fall back to stored data if API returns no results
          sales = await storage.getComparableSales(
            address as string,
            radius ? Number(radius) : undefined
          );
        }
      } catch (apiError) {
        console.warn("RentCast API failed, falling back to stored data:", apiError);
        sales = await storage.getComparableSales(
          address as string,
          radius ? Number(radius) : undefined
        );
      }
    } else {
      // Use stored data by default
      sales = await storage.getComparableSales(
        address as string,
        radius ? Number(radius) : undefined
      );
    }
    
    return NextResponse.json({ success: true, data: sales });
  } catch (error) {
    console.error("Error fetching comparable sales:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch comparable sales" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sale = await storage.createComparableSale(body);
    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    console.error("Error creating comparable sale:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create comparable sale" },
      { status: 400 }
    );
  }
}

