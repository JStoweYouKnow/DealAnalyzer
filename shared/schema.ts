import { z } from "zod";
import { createInsertSchema } from "drizzle-zod";

// Funding source types with associated down payment percentages
export const fundingSourceSchema = z.enum(['conventional', 'fha', 'va', 'dscr', 'cash']);

export const FUNDING_SOURCE_DOWN_PAYMENTS = {
  conventional: 0.05,  // 5%
  fha: 0.035,          // 3.5%
  va: 0.00,            // 0%
  dscr: 0.20,          // 20%
  cash: 0.00,          // 0% (no mortgage)
} as const;

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
  // Funding source
  fundingSource: fundingSourceSchema.optional().default('conventional'),
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

// Mortgage values schema for mortgage calculator input
export const mortgageValuesSchema = z.object({
  loanAmount: z.coerce.number().positive("Loan amount must be positive").finite("Loan amount must be a finite number"),
  loanTermYears: z.coerce.number().positive("Loan term must be positive").int("Loan term must be an integer").finite("Loan term must be a finite number"),
  monthlyPayment: z.coerce.number().positive("Monthly payment must be positive").finite("Monthly payment must be a finite number"),
});

export type MortgageValues = z.infer<typeof mortgageValuesSchema>;

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
  coc_benchmark_min: z.number().min(0, "COC benchmark minimum must be positive").max(100, "COC benchmark cannot exceed 100%").optional(),
  coc_benchmark_max: z.number().min(0, "COC benchmark maximum must be positive").max(100, "COC benchmark cannot exceed 100%").optional(),
  coc_minimum_min: z.number().min(0, "COC minimum minimum must be positive").max(100, "COC minimum cannot exceed 100%").optional(),
  coc_minimum_max: z.number().min(0, "COC minimum maximum must be positive").max(100, "COC minimum cannot exceed 100%").optional(),
  
  // Cap Rate range (as percentages, will be converted to decimals)
  cap_rate_min: z.number().min(0, "Cap rate minimum must be positive").max(100, "Cap rate cannot exceed 100%"),
  cap_rate_max: z.number().min(0, "Cap rate maximum must be positive").max(100, "Cap rate cannot exceed 100%"),
  cap_benchmark_min: z.number().min(0, "Cap benchmark minimum must be positive").max(100, "Cap benchmark cannot exceed 100%").optional(),
  cap_benchmark_max: z.number().min(0, "Cap benchmark maximum must be positive").max(100, "Cap benchmark cannot exceed 100%").optional(),
  cap_minimum: z.number().min(0, "Cap minimum must be positive").max(100, "Cap minimum cannot exceed 100%").optional(),
}).refine(data => data.price_min <= data.price_max, {
  message: "Minimum price cannot be greater than maximum price",
  path: ["price_max"]
}).refine(data => data.coc_return_min <= data.coc_return_max, {
  message: "Minimum COC return cannot be greater than maximum COC return", 
  path: ["coc_return_max"]
}).refine(data => data.cap_rate_min <= data.cap_rate_max, {
  message: "Minimum cap rate cannot be greater than maximum cap rate",
  path: ["cap_rate_max"]
}).refine(data => !data.coc_benchmark_min || !data.coc_benchmark_max || data.coc_benchmark_min <= data.coc_benchmark_max, {
  message: "COC benchmark minimum cannot be greater than maximum",
  path: ["coc_benchmark_max"]
}).refine(data => !data.coc_minimum_min || !data.coc_minimum_max || data.coc_minimum_min <= data.coc_minimum_max, {
  message: "COC minimum minimum cannot be greater than maximum",
  path: ["coc_minimum_max"]
}).refine(data => !data.cap_benchmark_min || !data.cap_benchmark_max || data.cap_benchmark_min <= data.cap_benchmark_max, {
  message: "Cap benchmark minimum cannot be greater than maximum",
  path: ["cap_benchmark_max"]
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
  userId: z.string().optional(), // User ID for email forwarding
  extractedProperty: z.object({
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    price: z.number().optional(),
    monthlyRent: z.number().optional(),
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    sqft: z.number().optional(),
    // Short-term rental metrics
    adr: z.number().optional(), // Average Daily Rate
    occupancyRate: z.number().optional(), // As decimal (0.75 = 75%)
    imageUrls: z.array(z.string()).optional(),
    sourceLinks: z.array(z.object({
      url: z.string(),
      type: z.enum(['listing', 'company', 'external', 'other']),
      description: z.string().optional(),
      aiScore: z.number().optional(), // 0-10 AI quality score
      aiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      aiReasoning: z.string().optional(),
    })).optional(),
    imageScores: z.array(z.object({
      url: z.string(),
      aiScore: z.number().optional(), // 0-10 AI quality score
      aiCategory: z.enum(['excellent', 'good', 'fair', 'poor']).optional(),
      aiReasoning: z.string().optional(),
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
export type FundingSource = z.infer<typeof fundingSourceSchema>;
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

// Market Intelligence schemas
export const neighborhoodTrendSchema = z.object({
  id: z.string().optional(),
  neighborhood: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string().optional(),
  // Price trends
  averagePrice: z.number(),
  priceChangePercent3Month: z.number(),
  priceChangePercent6Month: z.number(),
  priceChangePercent1Year: z.number(),
  // Rent trends
  averageRent: z.number(),
  rentChangePercent3Month: z.number(),
  rentChangePercent6Month: z.number(),
  rentChangePercent1Year: z.number(),
  // Market indicators
  daysOnMarket: z.number(),
  pricePerSqft: z.number(),
  rentYield: z.number(),
  marketHeat: z.enum(['hot', 'warm', 'balanced', 'cool', 'cold']),
  investmentGrade: z.enum(['A', 'B', 'C', 'D']).optional(),
  lastUpdated: z.date(),
});

export const comparableSaleSchema = z.object({
  id: z.string().optional(),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zipCode: z.string(),
  salePrice: z.number(),
  saleDate: z.date(),
  bedrooms: z.number(),
  bathrooms: z.number(),
  squareFootage: z.number(),
  lotSize: z.number().optional(),
  yearBuilt: z.number(),
  propertyType: z.string(),
  pricePerSqft: z.number(),
  distance: z.number(), // Distance from subject property in miles
  adjustments: z.object({
    size: z.number().optional(),
    condition: z.number().optional(),
    age: z.number().optional(),
    location: z.number().optional(),
    total: z.number(),
  }).optional(),
  createdAt: z.date(),
});

export const marketHeatMapDataSchema = z.object({
  id: z.string().optional(),
  zipCode: z.string(),
  city: z.string(),
  state: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  averagePrice: z.number(),
  priceChangePercent: z.number(),
  averageRent: z.number(),
  rentChangePercent: z.number(),
  dealVolume: z.number(),
  investmentScore: z.number().min(0).max(100),
  heatLevel: z.enum(['very_hot', 'hot', 'warm', 'balanced', 'cool']),
  lastUpdated: z.date(),
});

// Advanced Filtering & Search schemas
export const savedFilterSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  filterCriteria: z.object({
    priceMin: z.number().optional(),
    priceMax: z.number().optional(),
    bedroomsMin: z.number().optional(),
    bedroomsMax: z.number().optional(),
    bathroomsMin: z.number().optional(),
    bathroomsMax: z.number().optional(),
    sqftMin: z.number().optional(),
    sqftMax: z.number().optional(),
    cocReturnMin: z.number().optional(),
    cocReturnMax: z.number().optional(),
    capRateMin: z.number().optional(),
    capRateMax: z.number().optional(),
    cashFlowMin: z.number().optional(),
    propertyTypes: z.array(z.string()).optional(),
    cities: z.array(z.string()).optional(),
    states: z.array(z.string()).optional(),
    meetsCriteria: z.boolean().optional(),
    investmentGrade: z.array(z.enum(['A', 'B', 'C', 'D'])).optional(),
  }),
  userId: z.string().optional(), // User who created the filter
  isSystem: z.boolean().default(false), // System filters vs user-created
  usageCount: z.number().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const naturalLanguageSearchSchema = z.object({
  id: z.string().optional(),
  query: z.string(),
  parsedCriteria: z.object({
    bedrooms: z.number().optional(),
    bathrooms: z.number().optional(),
    priceMax: z.number().optional(),
    priceMin: z.number().optional(),
    location: z.string().optional(),
    propertyType: z.string().optional(),
    features: z.array(z.string()).optional(),
  }),
  resultCount: z.number(),
  searchDate: z.date(),
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

// AI-Powered Smart Recommendations schemas
export const smartPropertyRecommendationSchema = z.object({
  id: z.string().optional(),
  sourcePropertyId: z.string(),
  recommendedPropertyId: z.string(),
  similarityScore: z.number().min(0).max(100),
  matchReasons: z.array(z.string()),
  recommendationType: z.enum(['similar_location', 'similar_metrics', 'upgrade_opportunity', 'diversification']),
  confidenceScore: z.number().min(0).max(1),
  aiInsights: z.string(),
  createdAt: z.date(),
});

export const rentPricingRecommendationSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  currentRent: z.number(),
  recommendedRent: z.number(),
  adjustmentPercentage: z.number(),
  adjustmentReasons: z.array(z.string()),
  marketData: z.object({
    areaMedianRent: z.number(),
    competitorRents: z.array(z.number()),
    seasonalFactors: z.array(z.string()),
    demandIndicators: z.array(z.string()),
  }),
  riskAssessment: z.object({
    tenantRetentionRisk: z.enum(['low', 'medium', 'high']),
    vacancyRisk: z.enum(['low', 'medium', 'high']),
    marketRisk: z.enum(['low', 'medium', 'high']),
  }),
  implementation: z.object({
    recommendedTiming: z.string(),
    gradualIncreaseSchedule: z.array(z.object({
      effectiveDate: z.string(),
      newRent: z.number(),
    })).optional(),
    marketingStrategy: z.array(z.string()),
  }),
  createdAt: z.date(),
  validUntil: z.date(),
});

export const investmentTimingAdviceSchema = z.object({
  id: z.string().optional(),
  propertyId: z.string(),
  action: z.enum(['buy', 'hold', 'sell', 'refinance', 'improve']),
  urgency: z.enum(['immediate', 'within_3_months', 'within_6_months', 'within_1_year', 'monitor']),
  reasoning: z.array(z.string()),
  marketFactors: z.object({
    interestRateOutlook: z.string(),
    marketCyclePhase: z.enum(['recovery', 'expansion', 'peak', 'recession']),
    localMarketTrends: z.array(z.string()),
    seasonalConsiderations: z.array(z.string()),
  }),
  financialImplications: z.object({
    potentialGainLoss: z.number(),
    taxConsiderations: z.array(z.string()),
    cashFlowImpact: z.number(),
    equityPosition: z.number().optional(),
  }),
  riskFactors: z.array(z.string()),
  actionPlan: z.array(z.object({
    step: z.string(),
    timeline: z.string(),
    priority: z.enum(['high', 'medium', 'low']),
  })),
  createdAt: z.date(),
  expiresAt: z.date(),
});

// Import/Export & BiggerPockets Integration schemas
export const biggerPocketsImportSchema = z.object({
  // Property Details
  propertyAddress: z.string(),
  propertyCity: z.string(),
  propertyState: z.string(),
  propertyZip: z.string().optional(),
  propertyType: z.string(),
  propertyBedrooms: z.number().optional(),
  propertyBathrooms: z.number().optional(),
  propertySquareFootage: z.number().optional(),
  propertyYearBuilt: z.number().optional(),
  
  // Purchase Details
  purchasePrice: z.number(),
  closingCosts: z.number().optional(),
  downPayment: z.number().optional(),
  downPaymentPercentage: z.number().optional(),
  loanAmount: z.number().optional(),
  interestRate: z.number().optional(),
  loanTerm: z.number().optional(),
  
  // Income
  monthlyRent: z.number(),
  otherMonthlyIncome: z.number().optional(),
  
  // Monthly Expenses
  monthlyTaxes: z.number().optional(),
  monthlyInsurance: z.number().optional(),
  monthlyUtilities: z.number().optional(),
  monthlyMaintenance: z.number().optional(),
  monthlyManagement: z.number().optional(),
  monthlyHOA: z.number().optional(),
  monthlyCapEx: z.number().optional(),
  monthlyVacancy: z.number().optional(),
  otherMonthlyExpenses: z.number().optional(),
  
  // Analysis Settings
  appreciationRate: z.number().optional(),
  incomeGrowthRate: z.number().optional(),
  expenseGrowthRate: z.number().optional(),
  salesExpensePercentage: z.number().optional(),
  
  // Additional Data
  notes: z.string().optional(),
  source: z.string().optional().default("BiggerPockets Import"),
});

export const excelExportRequestSchema = z.object({
  propertyIds: z.array(z.string()).optional(),
  includeTemplate: z.boolean().default(true),
  templateType: z.enum(['biggerpockets', 'detailed', 'summary']).default('biggerpockets'),
  includeCharts: z.boolean().default(false),
});

export const csvExportRequestSchema = z.object({
  propertyIds: z.array(z.string()).optional(),
  includeHeaders: z.boolean().default(true),
  format: z.enum(['biggerpockets', 'standard']).default('biggerpockets'),
});

export const importResultSchema = z.object({
  success: z.boolean(),
  imported: z.number(),
  skipped: z.number(),
  errors: z.array(z.object({
    row: z.number(),
    error: z.string(),
    data: z.record(z.any()).optional(),
  })),
  properties: z.array(propertySchema).optional(),
});

export const apiIntegrationSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  baseUrl: z.string(),
  authType: z.enum(['api_key', 'oauth', 'basic', 'bearer']),
  authConfig: z.record(z.any()),
  endpoints: z.array(z.object({
    name: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
    path: z.string(),
    description: z.string(),
    parameters: z.array(z.object({
      name: z.string(),
      type: z.enum(['query', 'body', 'header']),
      required: z.boolean(),
      description: z.string(),
    })),
  })),
  rateLimits: z.object({
    requestsPerMinute: z.number(),
    requestsPerHour: z.number(),
    requestsPerDay: z.number(),
  }).optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  lastUsed: z.date().optional(),
});

export const insertApiIntegrationSchema = apiIntegrationSchema.omit({ id: true, createdAt: true, lastUsed: true });

// Template & Preset schemas
export const analysisTemplateSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  propertyType: z.string(),
  criteriaPreset: z.object({
    strategy: z.enum(['conservative', 'aggressive', 'brrrr', 'fix_and_flip', 'short_term_rental']),
    targetCoCReturn: z.number(),
    targetCapRate: z.number(),
    maxLoanToValue: z.number(),
    vacancyRate: z.number(),
    maintenanceRate: z.number(),
    managementRate: z.number(),
    expectedAppreciation: z.number(),
  }),
  scenarios: z.object({
    bestCase: z.object({
      rentIncrease: z.number(),
      appreciation: z.number(),
      vacancy: z.number(),
      maintenance: z.number(),
    }),
    realistic: z.object({
      rentIncrease: z.number(),
      appreciation: z.number(),
      vacancy: z.number(),
      maintenance: z.number(),
    }),
    worstCase: z.object({
      rentIncrease: z.number(),
      appreciation: z.number(),
      vacancy: z.number(),
      maintenance: z.number(),
    }),
  }),
  createdAt: z.date(),
  isDefault: z.boolean().default(false),
});

// Insert schemas
export const insertPropertySchema = propertySchema.omit({ id: true });
export const insertDealAnalysisSchema = dealAnalysisSchema.omit({ id: true, analysisDate: true });
export const insertNeighborhoodTrendSchema = neighborhoodTrendSchema.omit({ id: true });
export const insertComparableSaleSchema = comparableSaleSchema.omit({ id: true });
export const insertMarketHeatMapDataSchema = marketHeatMapDataSchema.omit({ id: true });
export const insertSavedFilterSchema = savedFilterSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertNaturalLanguageSearchSchema = naturalLanguageSearchSchema.omit({ id: true });
export const insertPropertyClassificationSchema = propertyClassificationSchema.omit({});
export const insertSmartPropertyRecommendationSchema = smartPropertyRecommendationSchema.omit({ id: true, createdAt: true });
export const insertRentPricingRecommendationSchema = rentPricingRecommendationSchema.omit({ id: true, createdAt: true });
export const insertInvestmentTimingAdviceSchema = investmentTimingAdviceSchema.omit({ id: true, createdAt: true });
export const insertAnalysisTemplateSchema = analysisTemplateSchema.omit({ id: true, createdAt: true });

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type InsertDealAnalysis = z.infer<typeof insertDealAnalysisSchema>;
export type NeighborhoodTrend = z.infer<typeof neighborhoodTrendSchema>;
export type ComparableSale = z.infer<typeof comparableSaleSchema>;
export type MarketHeatMapData = z.infer<typeof marketHeatMapDataSchema>;
export type SavedFilter = z.infer<typeof savedFilterSchema>;
export type NaturalLanguageSearch = z.infer<typeof naturalLanguageSearchSchema>;
export type PropertyClassification = z.infer<typeof propertyClassificationSchema>;
export type SmartPropertyRecommendation = z.infer<typeof smartPropertyRecommendationSchema>;
export type RentPricingRecommendation = z.infer<typeof rentPricingRecommendationSchema>;
export type InvestmentTimingAdvice = z.infer<typeof investmentTimingAdviceSchema>;
export type AnalysisTemplate = z.infer<typeof analysisTemplateSchema>;
export type InsertNeighborhoodTrend = z.infer<typeof insertNeighborhoodTrendSchema>;
export type InsertComparableSale = z.infer<typeof insertComparableSaleSchema>;
export type InsertMarketHeatMapData = z.infer<typeof insertMarketHeatMapDataSchema>;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;
export type InsertNaturalLanguageSearch = z.infer<typeof insertNaturalLanguageSearchSchema>;
export type InsertPropertyClassification = z.infer<typeof insertPropertyClassificationSchema>;
export type InsertSmartPropertyRecommendation = z.infer<typeof insertSmartPropertyRecommendationSchema>;
export type InsertRentPricingRecommendation = z.infer<typeof insertRentPricingRecommendationSchema>;
export type InsertInvestmentTimingAdvice = z.infer<typeof insertInvestmentTimingAdviceSchema>;
export type InsertAnalysisTemplate = z.infer<typeof insertAnalysisTemplateSchema>;
export type BiggerPocketsImport = z.infer<typeof biggerPocketsImportSchema>;
export type ExcelExportRequest = z.infer<typeof excelExportRequestSchema>;
export type CsvExportRequest = z.infer<typeof csvExportRequestSchema>;
export type ImportResult = z.infer<typeof importResultSchema>;
export type ApiIntegration = z.infer<typeof apiIntegrationSchema>;
export type InsertApiIntegration = z.infer<typeof insertApiIntegrationSchema>;

// ========================================
// Photo Analysis Schema
// ========================================

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

export const insertPhotoAnalysisSchema = photoAnalysisSchema.omit({ id: true });

export type PhotoAnalysis = z.infer<typeof photoAnalysisSchema>;
export type InsertPhotoAnalysis = z.infer<typeof insertPhotoAnalysisSchema>;
