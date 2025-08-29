import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Property data schema
export const propertySchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  propertyType: z.string(),
  purchasePrice: z.number(),
  monthlyRent: z.number(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFootage: z.number(),
  yearBuilt: z.number(),
  description: z.string(),
  listingUrl: z.string(),
});

// Deal analysis result schema
export const dealAnalysisSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  property: propertySchema,
  calculatedDownpayment: z.number(),
  calculatedClosingCosts: z.number(),
  calculatedInitialFixedCosts: z.number(),
  estimatedMaintenanceReserve: z.number(),
  totalCashNeeded: z.number(),
  passes1PercentRule: z.boolean(),
  cashFlow: z.number(),
  cashFlowPositive: z.boolean(),
  cocReturn: z.number(),
  cocMeetsBenchmark: z.boolean(),
  cocMeetsMinimum: z.boolean(),
  capRate: z.number(),
  capMeetsBenchmark: z.boolean(),
  capMeetsMinimum: z.boolean(),
  meetsCriteria: z.boolean(),
  analysisDate: z.date().optional(),
});

// API request/response schemas
export const analyzePropertyRequestSchema = z.object({
  emailContent: z.string().min(1, "Email content is required"),
});

export const analyzePropertyResponseSchema = z.object({
  success: z.boolean(),
  data: dealAnalysisSchema.optional(),
  error: z.string().optional(),
});

export const criteriaResponseSchema = z.object({
  property_types: z.array(z.string()),
  location: z.string(),
  max_purchase_price: z.number(),
  downpayment_percentage_min: z.number(),
  downpayment_percentage_max: z.number(),
  closing_costs_percentage_min: z.number(),
  closing_costs_percentage_max: z.number(),
  initial_fixed_costs_percentage: z.number(),
  maintenance_reserve_percentage: z.number(),
  coc_benchmark_min: z.number(),
  coc_benchmark_max: z.number(),
  coc_minimum_min: z.number(),
  coc_minimum_max: z.number(),
  cap_benchmark_min: z.number(),
  cap_benchmark_max: z.number(),
  cap_minimum: z.number(),
});

// Export types
export type Property = z.infer<typeof propertySchema>;
export type DealAnalysis = z.infer<typeof dealAnalysisSchema>;
export type AnalyzePropertyRequest = z.infer<typeof analyzePropertyRequestSchema>;
export type AnalyzePropertyResponse = z.infer<typeof analyzePropertyResponseSchema>;
export type CriteriaResponse = z.infer<typeof criteriaResponseSchema>;

// Insert schemas
export const insertPropertySchema = propertySchema.omit({ id: true });
export const insertDealAnalysisSchema = dealAnalysisSchema.omit({ id: true, analysisDate: true });

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertDealAnalysis = z.infer<typeof insertDealAnalysisSchema>;
