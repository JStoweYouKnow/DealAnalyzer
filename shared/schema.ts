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
  lotSize: z.number().optional(), // Lot size in square feet
  yearBuilt: z.number(),
  description: z.string(),
  listingUrl: z.string(),
  imageUrls: z.array(z.string()).optional(),
  sourceLinks: z.array(z.object({
    url: z.string(),
    type: z.enum(['listing', 'company', 'external', 'other']),
    description: z.string().optional(),
  })).optional(),
  // Short-term rental metrics
  adr: z.number().optional(), // Average Daily Rate
  occupancyRate: z.number().optional(), // As decimal (0.75 = 75%)
  // User-inputtable monthly expenses
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
});

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
  // Short-term rental criteria
  str_adr_minimum: z.number().optional(),
  str_occupancy_rate_minimum: z.number().optional(), // As decimal
  str_gross_yield_minimum: z.number().optional(), // As decimal
  str_annual_revenue_minimum: z.number().optional(),
});

// Configurable criteria ranges schema for user input
export const configurableCriteriaSchema = z.object({
  // Price range
  price_min: z.number().min(0, "Minimum price must be positive"),
  price_max: z.number().min(0, "Maximum price must be positive"),
  
  // COC Return range (as percentages, will be converted to decimals)
  coc_return_min: z.number().min(0, "COC return minimum must be positive").max(100, "COC return cannot exceed 100%"),
  coc_return_max: z.number().min(0, "COC return maximum must be positive").max(100, "COC return cannot exceed 100%"),
  
  // Cap Rate range (as percentages, will be converted to decimals)
  cap_rate_min: z.number().min(0, "Cap rate minimum must be positive").max(100, "Cap rate cannot exceed 100%"),
  cap_rate_max: z.number().min(0, "Cap rate maximum must be positive").max(100, "Cap rate cannot exceed 100%"),
}).refine(data => data.price_min <= data.price_max, {
  message: "Minimum price cannot be greater than maximum price",
  path: ["price_max"]
}).refine(data => data.coc_return_min <= data.coc_return_max, {
  message: "Minimum COC return cannot be greater than maximum COC return", 
  path: ["coc_return_max"]
}).refine(data => data.cap_rate_min <= data.cap_rate_max, {
  message: "Minimum cap rate cannot be greater than maximum cap rate",
  path: ["cap_rate_max"]
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

// Email Deal schemas
export const emailDealStatus = z.enum(['new', 'reviewed', 'analyzed', 'archived']);

export const emailDealSchema = z.object({
  id: z.string(),
  subject: z.string(),
  sender: z.string(),
  receivedDate: z.date(),
  emailContent: z.string(),
  extractedProperty: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    price: z.number().optional(),
    monthlyRent: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    sqft: z.number().optional(),
    imageUrls: z.array(z.string()).optional(),
    sourceLinks: z.array(z.object({
      url: z.string(),
      type: z.enum(['listing', 'company', 'external', 'other']),
      description: z.string().optional(),
    })).optional(),
  }).optional(),
  status: emailDealStatus,
  analysis: dealAnalysisSchema.optional(),
  contentHash: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const emailMonitoringResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(emailDealSchema).optional(),
  error: z.string().optional(),
});

// Export types
export type Property = z.infer<typeof propertySchema>;
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
export type EmailDeal = z.infer<typeof emailDealSchema>;
export type EmailMonitoringResponse = z.infer<typeof emailMonitoringResponseSchema>;

// Insert schemas
export const insertPropertySchema = propertySchema.omit({ id: true });
export const insertDealAnalysisSchema = dealAnalysisSchema.omit({ id: true, analysisDate: true });

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertDealAnalysis = z.infer<typeof insertDealAnalysisSchema>;
