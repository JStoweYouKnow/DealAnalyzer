import { NextRequest, NextResponse } from "next/server";
import { geocodingService } from "../../../server/services/geocoding-service";

export async function POST(request: NextRequest) {
  try {
    const { address, addresses } = await request.json();
    
    if (addresses && Array.isArray(addresses)) {
      // Batch geocode
      if (addresses.length === 0) {
        return NextResponse.json(
          { success: false, error: "Addresses array is required" },
          { status: 400 }
        );
      }

      const results = await geocodingService.geocodeAddresses(addresses);
      return NextResponse.json({ success: true, data: results });
    } else {
      // Single address geocode
      if (!address || typeof address !== 'string') {
        return NextResponse.json(
          { success: false, error: "Address is required" },
          { status: 400 }
        );
      }

      const result = await geocodingService.geocodeAddress(address);
      
      if (!result) {
        return NextResponse.json(
          { success: false, error: "Could not geocode address" },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, data: result });
    }
  } catch (error) {
    console.error("Error geocoding address:", error);
    return NextResponse.json(
      { success: false, error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}

