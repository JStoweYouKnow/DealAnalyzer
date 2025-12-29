// Re-export loadInvestmentCriteria from analysis engine
export { loadInvestmentCriteria } from '@dealanalyzer/analysis-engine';

// Default criteria matching convex/userCriteria.ts
export const DEFAULT_CRITERIA = {
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
} as const;
