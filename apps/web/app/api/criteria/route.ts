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
  // Use dynamic import with try-catch to handle missing Convex generated files
  // This prevents build errors when Convex files don't exist yet
  if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
    return null;
  }

  try {
    // Use Function constructor to create a dynamic import that webpack can't analyze
    // This prevents webpack from trying to resolve the module at build time
    const importPath = '../../../../convex/_generated/api';
    const dynamicImport = new Function('path', 'return import(path)');
    // @ts-ignore - dynamic import path
    const apiModule = await dynamicImport(importPath);
    return apiModule?.api || null;
  } catch (error: any) {
    // Convex API not generated yet or not available - this is OK
    // Only log if it's not a module not found error (which is expected)
    if (error?.code !== 'MODULE_NOT_FOUND' && !error?.message?.includes('Cannot find module')) {
      console.warn('Failed to import Convex API:', error?.message || error);
    }
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
    
    // Map single scalar values (as percentages) to decimals and create ranges for Convex
    // Form sends: coc_return, coc_benchmark, coc_minimum, cap_rate, cap_benchmark, cap_minimum (as percentages)
    // Convex expects: min/max pairs (as decimals)
    
    // Convert COC return from percentage to decimal and create a small range (±1%)
    const cocReturnDecimal = (criteria.coc_return ?? DEFAULT_CRITERIA.coc_minimum_min * 100) / 100;
    const coc_minimum_min = Math.max(0, cocReturnDecimal - 0.01); // 1% below target
    const coc_minimum_max = Math.min(1, cocReturnDecimal + 0.01); // 1% above target
    
    // Convert COC benchmark from percentage to decimal and create a small range (±1%)
    const cocBenchmarkDecimal = criteria.coc_benchmark !== undefined 
      ? criteria.coc_benchmark / 100 
      : cocReturnDecimal; // Default to coc_return if not provided
    const coc_benchmark_min = Math.max(0, cocBenchmarkDecimal - 0.01);
    const coc_benchmark_max = Math.min(1, cocBenchmarkDecimal + 0.01);
    
    // Convert COC minimum from percentage to decimal (use as-is, no range needed for minimum)
    const cocMinimumDecimal = criteria.coc_minimum !== undefined 
      ? criteria.coc_minimum / 100 
      : coc_minimum_min; // Default to coc_minimum_min if not provided
    
    // Convert cap rate from percentage to decimal and create a small range (±0.5%)
    const capRateDecimal = (criteria.cap_rate ?? DEFAULT_CRITERIA.cap_minimum * 100) / 100;
    const cap_benchmark_min = Math.max(0, capRateDecimal - 0.005); // 0.5% below target
    const cap_benchmark_max = Math.min(1, capRateDecimal + 0.005); // 0.5% above target
    
    // Convert cap minimum from percentage to decimal (use as-is)
    const cap_minimum = criteria.cap_minimum !== undefined 
      ? criteria.cap_minimum / 100 
      : (criteria.cap_benchmark !== undefined ? criteria.cap_benchmark / 100 : DEFAULT_CRITERIA.cap_minimum);
    
    // Use coc_minimum for the minimum range if provided, otherwise use coc_return range
    const finalCocMinimumMin = criteria.coc_minimum !== undefined ? cocMinimumDecimal : coc_minimum_min;
    const finalCocMinimumMax = criteria.coc_minimum !== undefined ? cocMinimumDecimal : coc_minimum_max;
    
    // Save to Convex database for persistence (only if userId is available)
    if (userId) {
      try {
        const client = await getConvexClient();
        const apiInstance = await getConvexApi();
        
        if (client && apiInstance && (apiInstance as any).userCriteria) {
          await client.mutation((apiInstance as any).userCriteria.updateCriteria, {
            userId,
            min_purchase_price: criteria.price_min ?? DEFAULT_CRITERIA.min_purchase_price,
            max_purchase_price: criteria.price_max ?? DEFAULT_CRITERIA.max_purchase_price,
            coc_minimum_min: finalCocMinimumMin,
            coc_minimum_max: finalCocMinimumMax,
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
      min_purchase_price: criteria.price_min ?? DEFAULT_CRITERIA.min_purchase_price,
      max_purchase_price: criteria.price_max ?? DEFAULT_CRITERIA.max_purchase_price,
      downpayment_percentage_min: DEFAULT_CRITERIA.downpayment_percentage_min,
      downpayment_percentage_max: DEFAULT_CRITERIA.downpayment_percentage_max,
      closing_costs_percentage_min: DEFAULT_CRITERIA.closing_costs_percentage_min,
      closing_costs_percentage_max: DEFAULT_CRITERIA.closing_costs_percentage_max,
      initial_fixed_costs_percentage: DEFAULT_CRITERIA.initial_fixed_costs_percentage,
      maintenance_reserve_percentage: DEFAULT_CRITERIA.maintenance_reserve_percentage,
      coc_benchmark_min,
      coc_benchmark_max,
      coc_minimum_min: finalCocMinimumMin,
      coc_minimum_max: finalCocMinimumMax,
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
