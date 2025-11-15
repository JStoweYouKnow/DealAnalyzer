import { NextRequest, NextResponse } from "next/server";
import { loadInvestmentCriteria, DEFAULT_CRITERIA } from "../../../server/services/criteria-service";
import { updateCriteriaRequestSchema } from "../../../shared/schema";
import type { CriteriaResponse } from "../../../shared/schema";
import { criteriaCache } from "../../lib/cache-service";
import { ConvexHttpClient } from 'convex/browser';

async function getConvexClient() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return null;
  }
  return new ConvexHttpClient(convexUrl);
}

async function getConvexApi(): Promise<any> {
  try {
    // @ts-ignore - Convex API types may not be generated yet, but this will work at runtime
    const apiModule = await import('../../../../convex/_generated/api');
    return apiModule.api;
  } catch (error) {
    console.error('Failed to import Convex API:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Try to get user ID for personalized criteria
    let userId: string | null = null;
    try {
      const { auth } = await import("@clerk/nextjs/server");
      const authResult = await auth();
      userId = authResult?.userId || null;
    } catch (error) {
      // Auth not available, use default criteria
    }

    // If user is authenticated, try to get their custom criteria from Convex
    if (userId) {
      try {
        // Check cache first with user-scoped key
        const cacheKey = `investment-criteria:${userId}`;
        const cachedCriteria = criteriaCache.get(cacheKey);
        if (cachedCriteria) {
          return NextResponse.json(cachedCriteria);
        }

        const client = await getConvexClient();
        const apiInstance = await getConvexApi();
        
        if (client && apiInstance && (apiInstance as any).userCriteria) {
          const userCriteria = await client.query((apiInstance as any).userCriteria.getCriteria, { userId });
          if (userCriteria) {
            // Cache user-specific criteria with user-scoped key
            criteriaCache.set(cacheKey, userCriteria, 3600);
            return NextResponse.json(userCriteria);
          }
        }
      } catch (error) {
        console.warn("Failed to load user criteria from Convex, falling back to default:", error);
      }
    }

    // Fall back to default criteria (cached or default)
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
    
    let userId: string | null = null;
    
    if (!shouldSkipAuth) {
      try {
        const { auth } = await import("@clerk/nextjs/server");
        const authResult = await auth();
        userId = authResult?.userId || null;
        if (!userId) {
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
    } else {
      // In dev mode with DISABLE_AUTH=true, still try to get userId if available
      try {
        const { auth } = await import("@clerk/nextjs/server");
        const authResult = await auth();
        userId = authResult?.userId || null;
      } catch (error) {
        // Auth not available, userId remains null
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
    
    // Save to Convex database for persistence (only if userId is available)
    if (userId) {
      try {
        const client = await getConvexClient();
        const apiInstance = await getConvexApi();
        
        if (client && apiInstance && (apiInstance as any).userCriteria) {
          await client.mutation((apiInstance as any).userCriteria.updateCriteria, {
            userId,
            max_purchase_price: criteria.price_max ?? DEFAULT_CRITERIA.max_purchase_price,
            coc_minimum_min,
            coc_minimum_max,
            coc_benchmark_min,
            coc_benchmark_max,
            cap_minimum,
            cap_benchmark_min,
            cap_benchmark_max,
          });

          // Load the updated criteria from Convex
          const updatedCriteria = await client.query((apiInstance as any).userCriteria.getCriteria, { userId });
          
          if (updatedCriteria) {
            // Also update cache for faster subsequent reads with user-scoped key
            const cacheKey = `investment-criteria:${userId}`;
            criteriaCache.set(cacheKey, updatedCriteria, 3600);
            
            console.log('Updated criteria in Convex:', {
              maxPurchasePrice: updatedCriteria.max_purchase_price,
              cocMinimum: updatedCriteria.coc_minimum_min,
              capMinimum: updatedCriteria.cap_minimum,
            });

            return NextResponse.json({
              success: true,
              data: updatedCriteria
            });
          }
        }
      } catch (error) {
        console.error("Error saving criteria to Convex:", error);
        // Continue with fallback to cache
      }
    }

    // Fallback: Build updated criteria structure and cache it (in-memory only, won't persist)
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
    
    console.log('Updated criteria (cache only - will not persist):', {
      maxPurchasePrice: updatedCriteria.max_purchase_price,
      cocMinimum: updatedCriteria.coc_minimum_min,
      capMinimum: updatedCriteria.cap_minimum,
    });
    
    // Update cache with new criteria (fallback if Convex not available) with user-scoped key
    const cacheKey = userId ? `investment-criteria:${userId}` : 'investment-criteria';
    criteriaCache.set(cacheKey, updatedCriteria, 3600);
    
    return NextResponse.json({
      success: true,
      data: updatedCriteria,
      warning: "Criteria saved to cache only. For persistence, ensure Convex is configured."
    });
  } catch (error) {
    console.error("Error updating criteria:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error during criteria update" },
      { status: 500 }
    );
  }
}
