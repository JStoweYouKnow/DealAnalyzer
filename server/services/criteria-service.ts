import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import type { CriteriaResponse } from "@shared/schema";

// Default criteria for Vercel/serverless environments
const DEFAULT_CRITERIA: CriteriaResponse = {
  property_types: ["Single Family", "Multi-Family", "Condo"],
  location: "Any",
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

export async function loadInvestmentCriteria(): Promise<CriteriaResponse> {
  // Always use default criteria - Python backend is no longer used
  // Criteria can be updated via the API PUT endpoint if needed in the future
  console.log("Loading investment criteria - using default values");
  return DEFAULT_CRITERIA;
}

export async function updateInvestmentCriteria(criteria: any): Promise<{success: boolean, error?: string}> {
  return new Promise((resolve) => {
    const pythonPath = path.join(process.cwd(), "python_modules");
    
    const python = spawn("python3", ["-c", `
import sys
sys.path.append('${pythonPath}')
from criteria_manager import update_investment_criteria
import json

criteria_data = {
    'price_min': ${criteria.price_min},
    'price_max': ${criteria.price_max},
    'coc_return_min': ${criteria.coc_return_min / 100},
    'coc_return_max': ${criteria.coc_return_max / 100},
    'cap_rate_min': ${criteria.cap_rate_min / 100},
    'cap_rate_max': ${criteria.cap_rate_max / 100}
}

result = update_investment_criteria('${path.join(pythonPath, 'investment_criteria.md')}', criteria_data)
print(json.dumps(result))
`]);

    let stdout = "";
    let stderr = "";

    python.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    python.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    python.on("close", (code) => {
      if (code !== 0) {
        resolve({
          success: false,
          error: "Failed to update criteria: " + stderr
        });
        return;
      }

      try {
        const result = JSON.parse(stdout);
        resolve(result);
      } catch (e) {
        resolve({
          success: false,
          error: "Failed to parse update result"
        });
      }
    });
  });
}

