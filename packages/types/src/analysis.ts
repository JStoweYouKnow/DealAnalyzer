import { z } from "zod";
import { propertySchema, fundingSourceSchema, mortgageValuesSchema } from "./property.js";

// AI Analysis schema
export const aiAnalysisSchema = z.object({
  propertyAssessment: z.object({
    overallScore: z.number().min(1).max(10), // 1-10 rating
    strengths: z.array(z.string()),
    redFlags: z.array(z.string()),
    description: z.string(),
    marketPosition: z.string(),
  }),
  marketIntelligence: z.object({
    sentimentScore: z.number().min(-1).max(1), // -1 to 1
    riskLevel: z.enum(['low', 'medium', 'high']),
    marketTrends: z.array(z.string()),
    competitiveAnalysis: z.string(),
  }),
  investmentRecommendation: z.object({
    recommendation: z.enum(['strong_buy', 'buy', 'hold', 'avoid']),
    confidence: z.number().min(0).max(1), // 0-1
    reasoning: z.array(z.string()),
    suggestedStrategy: z.string(),
    timeHorizon: z.string(),
  }),
  predictiveAnalysis: z.object({
    appreciationForecast: z.number(), // annual %
    rentGrowthForecast: z.number(), // annual %
    exitStrategy: z.string(),
    keyRisks: z.array(z.string()),
  }),
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
  // Short-term rental specific metrics
  projectedAnnualRevenue: z.number().optional(),
  projectedGrossYield: z.number().optional(), // As decimal
  totalMonthlyExpenses: z.number().optional(),
  strNetIncome: z.number().optional(), // STR-specific net income
  strMeetsCriteria: z.boolean().optional(),
  meetsCriteria: z.boolean(),
  // AI Analysis
  aiAnalysis: aiAnalysisSchema.optional(),
  analysisDate: z.date().optional(),
});

// API request/response schemas
export const analyzePropertyRequestSchema = z.object({
  emailContent: z.string().min(1, "Email content is required"),
  fundingSource: fundingSourceSchema.optional().default('conventional'),
  strMetrics: z.object({
    adr: z.number().optional(),
    occupancyRate: z.number().optional(),
  }).optional(),
  monthlyExpenses: z.object({
    propertyTaxes: z.number().optional(),
    insurance: z.number().optional(),
    utilities: z.number().optional(),
    management: z.number().optional(),
    maintenance: z.number().optional(),
    cleaning: z.number().optional(),
    supplies: z.number().optional(),
    other: z.number().optional(),
  }).optional(),
  mortgageValues: mortgageValuesSchema.optional(),
});

export const analyzePropertyResponseSchema = z.object({
  success: z.boolean(),
  data: dealAnalysisSchema.optional(),
  error: z.string().optional(),
});

export const criteriaResponseSchema = z.object({
  property_types: z.array(z.string()),
  location: z.string(),
  min_purchase_price: z.number(),
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
  // Short-term rental criteria
  str_adr_minimum: z.number().optional(),
  str_occupancy_rate_minimum: z.number().optional(), // As decimal
  str_gross_yield_minimum: z.number().optional(), // As decimal
  str_annual_revenue_minimum: z.number().optional(),
});

// Configurable criteria schema for user input (using single scalar values)
export const configurableCriteriaSchema = z.object({
  // Price range (kept as range since it makes sense)
  price_min: z.number().min(0, "Minimum price must be positive"),
  price_max: z.number().min(0, "Maximum price must be positive"),

  // COC Return (single scalar value as percentage, will be converted to decimal)
  coc_return: z.number().min(0, "COC return must be positive").max(100, "COC return cannot exceed 100%"),
  coc_benchmark: z.number().min(0, "COC benchmark must be positive").max(100, "COC benchmark cannot exceed 100%").optional(),
  coc_minimum: z.number().min(0, "COC minimum must be positive").max(100, "COC minimum cannot exceed 100%").optional(),

  // Cap Rate (single scalar value as percentage, will be converted to decimal)
  cap_rate: z.number().min(0, "Cap rate must be positive").max(100, "Cap rate cannot exceed 100%"),
  cap_benchmark: z.number().min(0, "Cap benchmark must be positive").max(100, "Cap benchmark cannot exceed 100%").optional(),
  cap_minimum: z.number().min(0, "Cap minimum must be positive").max(100, "Cap minimum cannot exceed 100%").optional(),
}).refine(data => data.price_min <= data.price_max, {
  message: "Minimum price cannot be greater than maximum price",
  path: ["price_max"]
});

// Update criteria request schema
export const updateCriteriaRequestSchema = z.object({
  criteria: configurableCriteriaSchema
});

// Property comparison schema
export const propertyComparisonSchema = z.object({
  id: z.string(),
  name: z.string().optional(), // User-defined name for comparison
  properties: z.array(dealAnalysisSchema).min(2, "Need at least 2 properties to compare").max(4, "Can compare up to 4 properties"),
  createdAt: z.date().optional(),
});

export const createComparisonRequestSchema = z.object({
  name: z.string().optional(),
  propertyIds: z.array(z.string()).min(2, "Need at least 2 properties to compare").max(4, "Can compare up to 4 properties"),
});

export const comparisonResponseSchema = z.object({
  success: z.boolean(),
  data: propertyComparisonSchema.optional(),
  error: z.string().optional(),
});

export const propertyClassificationSchema = z.object({
  propertyId: z.string(),
  investmentGrade: z.enum(['A', 'B', 'C', 'D']),
  classificationReasons: z.array(z.string()),
  confidenceScore: z.number().min(0).max(1),
  factors: z.object({
    locationScore: z.number(),
    conditionScore: z.number(),
    marketScore: z.number(),
    financialScore: z.number(),
  }),
  lastUpdated: z.date(),
});

// Photo Analysis Schema
export const photoAnalysisSchema = z.object({
  id: z.string(),
  propertyId: z.string(),
  filename: z.string(),
  url: z.string(),
  aiScore: z.number(),
  qualityScore: z.number(),
  compositionScore: z.number(),
  lightingScore: z.number(),
  propertyConditionScore: z.number(),
  insights: z.array(z.string()),
  suggestions: z.array(z.string()),
  tags: z.array(z.string()),
  roomType: z.string().optional(),
  marketability: z.enum(['high', 'medium', 'low']),
  analysisDate: z.string(),
});

// Insert schemas
export const insertDealAnalysisSchema = dealAnalysisSchema.omit({ id: true, analysisDate: true });
export const insertPropertyClassificationSchema = propertyClassificationSchema.omit({});
export const insertPhotoAnalysisSchema = photoAnalysisSchema.omit({ id: true });

// Export types
export type AIAnalysis = z.infer<typeof aiAnalysisSchema>;
export type DealAnalysis = z.infer<typeof dealAnalysisSchema>;
export type AnalyzePropertyRequest = z.infer<typeof analyzePropertyRequestSchema>;
export type AnalyzePropertyResponse = z.infer<typeof analyzePropertyResponseSchema>;
export type CriteriaResponse = z.infer<typeof criteriaResponseSchema>;
export type ConfigurableCriteria = z.infer<typeof configurableCriteriaSchema>;
export type UpdateCriteriaRequest = z.infer<typeof updateCriteriaRequestSchema>;
export type PropertyComparison = z.infer<typeof propertyComparisonSchema>;
export type CreateComparisonRequest = z.infer<typeof createComparisonRequestSchema>;
export type ComparisonResponse = z.infer<typeof comparisonResponseSchema>;
export type PropertyClassification = z.infer<typeof propertyClassificationSchema>;
export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;
export type InsertDealAnalysis = z.infer<typeof insertDealAnalysisSchema>;
export type InsertPropertyClassification = z.infer<typeof insertPropertyClassificationSchema>;
export type InsertPhotoAnalysis = z.infer<typeof insertPhotoAnalysisSchema>;
