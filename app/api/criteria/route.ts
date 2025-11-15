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
    // Only skip auth in non-production development mode with explicit opt-in
    const shouldSkipAuth = 
      process.env.NODE_ENV !== 'production' && 
      process.env.DISABLE_AUTH === 'true';
    
    if (!shouldSkipAuth) {
      try {
        const { auth } = await import("@clerk/nextjs/server");
        const authResult = await auth();
        if (!authResult?.userId) {
          console.warn("Authentication failed: missing userId");
          return NextResponse.json(
            { error: "Unauthorized" },
            { status: 401 }
          );
        }
      } catch (error) {
        // Fail-closed: log auth failure and return 401
        console.error("Authentication error:", error);
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }
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
    
    // Map form fields to API fields
    // Form sends: coc_return_min/max (as percentages like 8.0, 15.0)
    // API expects: coc_minimum_min/max (as decimals like 0.08, 0.15)
    const coc_minimum_min = criteria.coc_return_min !== undefined 
      ? criteria.coc_return_min / 100 
      : (criteria.coc_minimum_min !== undefined ? criteria.coc_minimum_min / 100 : DEFAULT_CRITERIA.coc_minimum_min);
    const coc_minimum_max = criteria.coc_return_max !== undefined 
      ? criteria.coc_return_max / 100 
      : (criteria.coc_minimum_max !== undefined ? criteria.coc_minimum_max / 100 : DEFAULT_CRITERIA.coc_minimum_max);
    
    // Use coc_return values for benchmark if provided, otherwise use defaults or explicit benchmark values
    const coc_benchmark_min = criteria.coc_benchmark_min !== undefined 
      ? criteria.coc_benchmark_min / 100 
      : (criteria.coc_return_min !== undefined ? criteria.coc_return_min / 100 : DEFAULT_CRITERIA.coc_benchmark_min);
    const coc_benchmark_max = criteria.coc_benchmark_max !== undefined 
      ? criteria.coc_benchmark_max / 100 
      : (criteria.coc_return_max !== undefined ? criteria.coc_return_max / 100 : DEFAULT_CRITERIA.coc_benchmark_max);
    
    // Form sends: cap_rate_min/max (as percentages like 4.0, 12.0)
    // API expects: cap_minimum (as decimal like 0.04) and cap_benchmark_max (as decimal like 0.12)
    const cap_minimum = criteria.cap_rate_min !== undefined 
      ? criteria.cap_rate_min / 100 
      : (criteria.cap_minimum !== undefined ? criteria.cap_minimum / 100 : DEFAULT_CRITERIA.cap_minimum);
    const cap_benchmark_max = criteria.cap_rate_max !== undefined 
      ? criteria.cap_rate_max / 100 
      : (criteria.cap_benchmark_max !== undefined ? criteria.cap_benchmark_max / 100 : DEFAULT_CRITERIA.cap_benchmark_max);
    const cap_benchmark_min = criteria.cap_benchmark_min !== undefined 
      ? criteria.cap_benchmark_min / 100 
      : (criteria.cap_rate_min !== undefined ? criteria.cap_rate_min / 100 : DEFAULT_CRITERIA.cap_benchmark_min);
    
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
      coc_benchmark_min,
      coc_benchmark_max,
      coc_minimum_min,
      coc_minimum_max,
      cap_benchmark_min,
      cap_benchmark_max,
      cap_minimum,
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
    
    // Update cache with new criteria so subsequent reads get the updated values
    criteriaCache.set('investment-criteria', updatedCriteria, 3600); // Cache for 1 hour
    
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
