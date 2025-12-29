import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { storage } from "../../../../server/storage";
import { ZodError } from "zod";

const filtersSchema = z.object({
  priceMin: z.number().optional(),
  priceMax: z.number().optional(),
  bedroomsMin: z.number().optional(),
  bedroomsMax: z.number().optional(),
  bathroomsMin: z.number().optional(),
  bathroomsMax: z.number().optional(),
  sqftMin: z.number().optional(),
  sqftMax: z.number().optional(),
  cocReturnMin: z.number().optional(),
  cocReturnMax: z.number().optional(),
  capRateMin: z.number().optional(),
  capRateMax: z.number().optional(),
  cashFlowMin: z.number().optional(),
  propertyTypes: z.array(z.string()).optional(),
  cities: z.array(z.string()).optional(),
  states: z.array(z.string()).optional(),
  meetsCriteria: z.boolean().optional(),
  investmentGrade: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const filters = filtersSchema.parse(body);
    const results = await storage.searchProperties(filters);
    return NextResponse.json({ success: true, data: results });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid filter parameters",
          validationErrors: error.errors,
        },
        { status: 400 }
      );
    }
    console.error("Error searching properties:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search properties" },
      { status: 500 }
    );
  }
}

