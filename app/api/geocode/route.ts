import { NextRequest, NextResponse } from "next/server";
import { geocodingService } from "../../../server/services/geocoding-service";
import { logger } from "@/lib/logger";

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

      logger.info("Batch geocoding addresses", { count: addresses.length });
      const results = await geocodingService.geocodeAddresses(addresses);
      logger.info("Batch geocoding completed", { count: results.length });
      return NextResponse.json({ success: true, data: results });
    } else {
      // Single address geocode
      if (!address || typeof address !== 'string') {
        return NextResponse.json(
          { success: false, error: "Address is required" },
          { status: 400 }
        );
      }

      logger.debug("Geocoding single address", { address });
      const result = await geocodingService.geocodeAddress(address);
      
      if (!result) {
        logger.warn("Could not geocode address", { address });
        return NextResponse.json(
          { success: false, error: "Could not geocode address" },
          { status: 404 }
        );
      }

      logger.debug("Geocoding successful", { address, lat: result.lat, lng: result.lng });
      return NextResponse.json({ success: true, data: result });
    }
  } catch (error) {
    logger.error("Error geocoding address", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { success: false, error: "Failed to geocode address" },
      { status: 500 }
    );
  }
}

