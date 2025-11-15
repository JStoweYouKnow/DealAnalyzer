import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import type { CriteriaResponse } from "@shared/schema";

// Default criteria for Vercel/serverless environments
export const DEFAULT_CRITERIA: CriteriaResponse = {
  property_types: ["Single Family", "Multi-Family", "Condo"],
  location: "Any",
  min_purchase_price: 0,
  max_purchase_price: 500000,
  downpayment_percentage_min: 0.20,
  downpayment_percentage_max: 0.25,
  closing_costs_percentage_min: 0.02,
  closing_costs_percentage_max: 0.05,
  initial_fixed_costs_percentage: 0.01,
  maintenance_reserve_percentage: 0.10,
  coc_benchmark_min: 0.08,
  coc_benchmark_max: 0.30,
  coc_minimum_min: 0.06,
  coc_minimum_max: 0.15,
  cap_benchmark_min: 0.05,
  cap_benchmark_max: 0.15,
  cap_minimum: 0.04,
  str_adr_minimum: 100,
  str_occupancy_rate_minimum: 0.60,
  str_gross_yield_minimum: 0.08,
  str_annual_revenue_minimum: 20000,
};

import { criteriaCache, getCachedOrFetch } from '../../app/lib/cache-service';

export async function loadInvestmentCriteria(): Promise<CriteriaResponse> {
  // Always use default criteria - Python backend is no longer used
  // Criteria can be updated via the API PUT endpoint if needed in the future
  try {
    return await getCachedOrFetch(
      criteriaCache,
      'investment-criteria',
      async () => {
        console.log("Loading investment criteria - using default values");
        return DEFAULT_CRITERIA;
      }
    );
  } catch (error) {
    console.error("Error loading investment criteria from cache:", error);
    return DEFAULT_CRITERIA;
  }
}

// Note: This function is no longer used - criteria updates are handled directly in the API route
// Keeping for backwards compatibility but it's deprecated
export async function updateInvestmentCriteria(criteria: any): Promise<{success: boolean, error?: string}> {
  console.warn("updateInvestmentCriteria is deprecated - criteria updates are handled in API route");
  return Promise.resolve({ success: true });
}

