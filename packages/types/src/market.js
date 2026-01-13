import { z } from "zod";
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
export const insertNeighborhoodTrendSchema = neighborhoodTrendSchema.omit({ id: true });
export const insertComparableSaleSchema = comparableSaleSchema.omit({ id: true });
export const insertMarketHeatMapDataSchema = marketHeatMapDataSchema.omit({ id: true });
export const insertSavedFilterSchema = savedFilterSchema.omit({ id: true, createdAt: true, updatedAt: true });
export const insertNaturalLanguageSearchSchema = naturalLanguageSearchSchema.omit({ id: true });
export const insertSmartPropertyRecommendationSchema = smartPropertyRecommendationSchema.omit({ id: true, createdAt: true });
export const insertRentPricingRecommendationSchema = rentPricingRecommendationSchema.omit({ id: true, createdAt: true });
export const insertInvestmentTimingAdviceSchema = investmentTimingAdviceSchema.omit({ id: true, createdAt: true });
export const insertAnalysisTemplateSchema = analysisTemplateSchema.omit({ id: true, createdAt: true });
