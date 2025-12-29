import { NextRequest, NextResponse } from "next/server";
import { rentalCompsService } from "../../../server/rental-comps-service";

export async function POST(request: NextRequest) {
  try {
    const { address, bedrooms, bathrooms, squareFootage } = await request.json();
    
    if (!address || !bedrooms || !bathrooms) {
      return NextResponse.json(
        { success: false, error: "Address, bedrooms, and bathrooms are required" },
        { status: 400 }
      );
    }
    
    console.log(`Searching rental comps for: ${address}, ${bedrooms}BR/${bathrooms}BA`);
    
    const compsResult = await rentalCompsService.searchRentalComps(
      address,
      bedrooms,
      bathrooms,
      squareFootage
    );
    
    return NextResponse.json({
      success: true,
      data: compsResult
    });
  } catch (error) {
    console.error("Error fetching rental comps:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch rental comparables" },
      { status: 500 }
    );
  }
}

