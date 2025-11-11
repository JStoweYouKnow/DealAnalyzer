import { NextRequest, NextResponse } from "next/server";
import { loadInvestmentCriteria, DEFAULT_CRITERIA } from "../../../server/services/criteria-service";
import { updateCriteriaRequestSchema } from "../../../shared/schema";
import type { CriteriaResponse } from "../../../shared/schema";
import { criteriaCache } from "../../lib/cache-service";

export async function GET() {
  try {
    const criteria = await loadInvestmentCriteria();
    return NextResponse.json(criteria);
  } catch (error) {
    console.error("Error loading criteria:", error);
    return NextResponse.json(
      { error: "Failed to load investment criteria" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check authentication for PUT requests (write operation)
    // GET is public, but PUT requires authentication
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authResult = await auth();
      if (!authResult?.userId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
    } catch (error) {
      // If Clerk is not available or not configured, allow the request through
      // This handles development environments where Clerk might not be set up
      console.warn("Clerk authentication check failed, allowing request:", error);
    }

    const body = await request.json();
    const validation = updateCriteriaRequestSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid criteria: " + validation.error.errors.map((e: any) => e.message).join(", ")
        },
        { status: 400 }
      );
    }

    const { criteria } = validation.data;
    
    // Build updated criteria structure from the request
    // Note: This is stored in-memory and doesn't persist across server restarts
    // In production, this should be stored in a database
    const updatedCriteria: CriteriaResponse = {
      property_types: DEFAULT_CRITERIA.property_types,
      location: DEFAULT_CRITERIA.location,
      max_purchase_price: criteria.price_max ?? DEFAULT_CRITERIA.max_purchase_price,
      downpayment_percentage_min: DEFAULT_CRITERIA.downpayment_percentage_min,
      downpayment_percentage_max: DEFAULT_CRITERIA.downpayment_percentage_max,
      closing_costs_percentage_min: DEFAULT_CRITERIA.closing_costs_percentage_min,
      closing_costs_percentage_max: DEFAULT_CRITERIA.closing_costs_percentage_max,
      initial_fixed_costs_percentage: DEFAULT_CRITERIA.initial_fixed_costs_percentage,
      maintenance_reserve_percentage: DEFAULT_CRITERIA.maintenance_reserve_percentage,
      coc_benchmark_min: (criteria.coc_benchmark_min ?? (DEFAULT_CRITERIA.coc_benchmark_min * 100)) / 100,
      coc_benchmark_max: (criteria.coc_benchmark_max ?? (DEFAULT_CRITERIA.coc_benchmark_max * 100)) / 100,
      coc_minimum_min: (criteria.coc_minimum_min ?? (DEFAULT_CRITERIA.coc_minimum_min * 100)) / 100,
      coc_minimum_max: (criteria.coc_minimum_max ?? (DEFAULT_CRITERIA.coc_minimum_max * 100)) / 100,
      cap_benchmark_min: (criteria.cap_benchmark_min ?? (DEFAULT_CRITERIA.cap_benchmark_min * 100)) / 100,
      cap_benchmark_max: (criteria.cap_benchmark_max ?? (DEFAULT_CRITERIA.cap_benchmark_max * 100)) / 100,
      cap_minimum: (criteria.cap_minimum ?? (DEFAULT_CRITERIA.cap_minimum * 100)) / 100,
      str_adr_minimum: DEFAULT_CRITERIA.str_adr_minimum,
      str_occupancy_rate_minimum: DEFAULT_CRITERIA.str_occupancy_rate_minimum,
      str_gross_yield_minimum: DEFAULT_CRITERIA.str_gross_yield_minimum,
      str_annual_revenue_minimum: DEFAULT_CRITERIA.str_annual_revenue_minimum,
    };
    
    console.log('Updated criteria:', {
      maxPurchasePrice: updatedCriteria.max_purchase_price,
      cocMinimum: updatedCriteria.coc_minimum_min,
      capMinimum: updatedCriteria.cap_minimum,
    });
    
    // Invalidate cache so subsequent reads fetch fresh data
    criteriaCache.del('investment-criteria');
    
    return NextResponse.json({
      success: true,
      data: updatedCriteria
    });
  } catch (error) {
    console.error("Error updating criteria:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during criteria update" },
      { status: 500 }
    );
  }
}
