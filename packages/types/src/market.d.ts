import { z } from "zod";
export declare const neighborhoodTrendSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    neighborhood: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodOptional<z.ZodString>;
    averagePrice: z.ZodNumber;
    priceChangePercent3Month: z.ZodNumber;
    priceChangePercent6Month: z.ZodNumber;
    priceChangePercent1Year: z.ZodNumber;
    averageRent: z.ZodNumber;
    rentChangePercent3Month: z.ZodNumber;
    rentChangePercent6Month: z.ZodNumber;
    rentChangePercent1Year: z.ZodNumber;
    daysOnMarket: z.ZodNumber;
    pricePerSqft: z.ZodNumber;
    rentYield: z.ZodNumber;
    marketHeat: z.ZodEnum<["hot", "warm", "balanced", "cool", "cold"]>;
    investmentGrade: z.ZodOptional<z.ZodEnum<["A", "B", "C", "D"]>>;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    city: string;
    state: string;
    neighborhood: string;
    averagePrice: number;
    priceChangePercent3Month: number;
    priceChangePercent6Month: number;
    priceChangePercent1Year: number;
    averageRent: number;
    rentChangePercent3Month: number;
    rentChangePercent6Month: number;
    rentChangePercent1Year: number;
    daysOnMarket: number;
    pricePerSqft: number;
    rentYield: number;
    marketHeat: "hot" | "warm" | "balanced" | "cool" | "cold";
    lastUpdated: Date;
    id?: string | undefined;
    zipCode?: string | undefined;
    investmentGrade?: "A" | "B" | "C" | "D" | undefined;
}, {
    city: string;
    state: string;
    neighborhood: string;
    averagePrice: number;
    priceChangePercent3Month: number;
    priceChangePercent6Month: number;
    priceChangePercent1Year: number;
    averageRent: number;
    rentChangePercent3Month: number;
    rentChangePercent6Month: number;
    rentChangePercent1Year: number;
    daysOnMarket: number;
    pricePerSqft: number;
    rentYield: number;
    marketHeat: "hot" | "warm" | "balanced" | "cool" | "cold";
    lastUpdated: Date;
    id?: string | undefined;
    zipCode?: string | undefined;
    investmentGrade?: "A" | "B" | "C" | "D" | undefined;
}>;
export declare const comparableSaleSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodString;
    salePrice: z.ZodNumber;
    saleDate: z.ZodDate;
    bedrooms: z.ZodNumber;
    bathrooms: z.ZodNumber;
    squareFootage: z.ZodNumber;
    lotSize: z.ZodOptional<z.ZodNumber>;
    yearBuilt: z.ZodNumber;
    propertyType: z.ZodString;
    pricePerSqft: z.ZodNumber;
    distance: z.ZodNumber;
    adjustments: z.ZodOptional<z.ZodObject<{
        size: z.ZodOptional<z.ZodNumber>;
        condition: z.ZodOptional<z.ZodNumber>;
        age: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodNumber>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    }, {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    createdAt: Date;
    pricePerSqft: number;
    salePrice: number;
    saleDate: Date;
    distance: number;
    id?: string | undefined;
    lotSize?: number | undefined;
    adjustments?: {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    } | undefined;
}, {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    createdAt: Date;
    pricePerSqft: number;
    salePrice: number;
    saleDate: Date;
    distance: number;
    id?: string | undefined;
    lotSize?: number | undefined;
    adjustments?: {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    } | undefined;
}>;
export declare const marketHeatMapDataSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    averagePrice: z.ZodNumber;
    priceChangePercent: z.ZodNumber;
    averageRent: z.ZodNumber;
    rentChangePercent: z.ZodNumber;
    dealVolume: z.ZodNumber;
    investmentScore: z.ZodNumber;
    heatLevel: z.ZodEnum<["very_hot", "hot", "warm", "balanced", "cool"]>;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    city: string;
    state: string;
    zipCode: string;
    averagePrice: number;
    averageRent: number;
    lastUpdated: Date;
    latitude: number;
    longitude: number;
    priceChangePercent: number;
    rentChangePercent: number;
    dealVolume: number;
    investmentScore: number;
    heatLevel: "hot" | "warm" | "balanced" | "cool" | "very_hot";
    id?: string | undefined;
}, {
    city: string;
    state: string;
    zipCode: string;
    averagePrice: number;
    averageRent: number;
    lastUpdated: Date;
    latitude: number;
    longitude: number;
    priceChangePercent: number;
    rentChangePercent: number;
    dealVolume: number;
    investmentScore: number;
    heatLevel: "hot" | "warm" | "balanced" | "cool" | "very_hot";
    id?: string | undefined;
}>;
export declare const savedFilterSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    filterCriteria: z.ZodObject<{
        priceMin: z.ZodOptional<z.ZodNumber>;
        priceMax: z.ZodOptional<z.ZodNumber>;
        bedroomsMin: z.ZodOptional<z.ZodNumber>;
        bedroomsMax: z.ZodOptional<z.ZodNumber>;
        bathroomsMin: z.ZodOptional<z.ZodNumber>;
        bathroomsMax: z.ZodOptional<z.ZodNumber>;
        sqftMin: z.ZodOptional<z.ZodNumber>;
        sqftMax: z.ZodOptional<z.ZodNumber>;
        cocReturnMin: z.ZodOptional<z.ZodNumber>;
        cocReturnMax: z.ZodOptional<z.ZodNumber>;
        capRateMin: z.ZodOptional<z.ZodNumber>;
        capRateMax: z.ZodOptional<z.ZodNumber>;
        cashFlowMin: z.ZodOptional<z.ZodNumber>;
        propertyTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        cities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        states: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        meetsCriteria: z.ZodOptional<z.ZodBoolean>;
        investmentGrade: z.ZodOptional<z.ZodArray<z.ZodEnum<["A", "B", "C", "D"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    }, {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    }>;
    userId: z.ZodOptional<z.ZodString>;
    isSystem: z.ZodDefault<z.ZodBoolean>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    createdAt: Date;
    updatedAt: Date;
    name: string;
    filterCriteria: {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    };
    isSystem: boolean;
    usageCount: number;
    id?: string | undefined;
    description?: string | undefined;
    userId?: string | undefined;
}, {
    createdAt: Date;
    updatedAt: Date;
    name: string;
    filterCriteria: {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    };
    id?: string | undefined;
    description?: string | undefined;
    userId?: string | undefined;
    isSystem?: boolean | undefined;
    usageCount?: number | undefined;
}>;
export declare const naturalLanguageSearchSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    query: z.ZodString;
    parsedCriteria: z.ZodObject<{
        bedrooms: z.ZodOptional<z.ZodNumber>;
        bathrooms: z.ZodOptional<z.ZodNumber>;
        priceMax: z.ZodOptional<z.ZodNumber>;
        priceMin: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodString>;
        propertyType: z.ZodOptional<z.ZodString>;
        features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    }, {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    }>;
    resultCount: z.ZodNumber;
    searchDate: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    query: string;
    parsedCriteria: {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    };
    resultCount: number;
    searchDate: Date;
    id?: string | undefined;
}, {
    query: string;
    parsedCriteria: {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    };
    resultCount: number;
    searchDate: Date;
    id?: string | undefined;
}>;
export declare const smartPropertyRecommendationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    sourcePropertyId: z.ZodString;
    recommendedPropertyId: z.ZodString;
    similarityScore: z.ZodNumber;
    matchReasons: z.ZodArray<z.ZodString, "many">;
    recommendationType: z.ZodEnum<["similar_location", "similar_metrics", "upgrade_opportunity", "diversification"]>;
    confidenceScore: z.ZodNumber;
    aiInsights: z.ZodString;
    createdAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    createdAt: Date;
    confidenceScore: number;
    sourcePropertyId: string;
    recommendedPropertyId: string;
    similarityScore: number;
    matchReasons: string[];
    recommendationType: "similar_location" | "similar_metrics" | "upgrade_opportunity" | "diversification";
    aiInsights: string;
    id?: string | undefined;
}, {
    createdAt: Date;
    confidenceScore: number;
    sourcePropertyId: string;
    recommendedPropertyId: string;
    similarityScore: number;
    matchReasons: string[];
    recommendationType: "similar_location" | "similar_metrics" | "upgrade_opportunity" | "diversification";
    aiInsights: string;
    id?: string | undefined;
}>;
export declare const rentPricingRecommendationSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    currentRent: z.ZodNumber;
    recommendedRent: z.ZodNumber;
    adjustmentPercentage: z.ZodNumber;
    adjustmentReasons: z.ZodArray<z.ZodString, "many">;
    marketData: z.ZodObject<{
        areaMedianRent: z.ZodNumber;
        competitorRents: z.ZodArray<z.ZodNumber, "many">;
        seasonalFactors: z.ZodArray<z.ZodString, "many">;
        demandIndicators: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    }, {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    }>;
    riskAssessment: z.ZodObject<{
        tenantRetentionRisk: z.ZodEnum<["low", "medium", "high"]>;
        vacancyRisk: z.ZodEnum<["low", "medium", "high"]>;
        marketRisk: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    }, {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    }>;
    implementation: z.ZodObject<{
        recommendedTiming: z.ZodString;
        gradualIncreaseSchedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
            effectiveDate: z.ZodString;
            newRent: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            effectiveDate: string;
            newRent: number;
        }, {
            effectiveDate: string;
            newRent: number;
        }>, "many">>;
        marketingStrategy: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    }, {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    }>;
    createdAt: z.ZodDate;
    validUntil: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    propertyId: string;
    createdAt: Date;
    currentRent: number;
    recommendedRent: number;
    adjustmentPercentage: number;
    adjustmentReasons: string[];
    marketData: {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    };
    riskAssessment: {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    };
    implementation: {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    };
    validUntil: Date;
    id?: string | undefined;
}, {
    propertyId: string;
    createdAt: Date;
    currentRent: number;
    recommendedRent: number;
    adjustmentPercentage: number;
    adjustmentReasons: string[];
    marketData: {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    };
    riskAssessment: {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    };
    implementation: {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    };
    validUntil: Date;
    id?: string | undefined;
}>;
export declare const investmentTimingAdviceSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    action: z.ZodEnum<["buy", "hold", "sell", "refinance", "improve"]>;
    urgency: z.ZodEnum<["immediate", "within_3_months", "within_6_months", "within_1_year", "monitor"]>;
    reasoning: z.ZodArray<z.ZodString, "many">;
    marketFactors: z.ZodObject<{
        interestRateOutlook: z.ZodString;
        marketCyclePhase: z.ZodEnum<["recovery", "expansion", "peak", "recession"]>;
        localMarketTrends: z.ZodArray<z.ZodString, "many">;
        seasonalConsiderations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    }, {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    }>;
    financialImplications: z.ZodObject<{
        potentialGainLoss: z.ZodNumber;
        taxConsiderations: z.ZodArray<z.ZodString, "many">;
        cashFlowImpact: z.ZodNumber;
        equityPosition: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    }, {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    }>;
    riskFactors: z.ZodArray<z.ZodString, "many">;
    actionPlan: z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        timeline: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }, {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }>, "many">;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    propertyId: string;
    createdAt: Date;
    action: "buy" | "hold" | "sell" | "refinance" | "improve";
    urgency: "immediate" | "within_3_months" | "within_6_months" | "within_1_year" | "monitor";
    reasoning: string[];
    marketFactors: {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    };
    financialImplications: {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    };
    riskFactors: string[];
    actionPlan: {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }[];
    expiresAt: Date;
    id?: string | undefined;
}, {
    propertyId: string;
    createdAt: Date;
    action: "buy" | "hold" | "sell" | "refinance" | "improve";
    urgency: "immediate" | "within_3_months" | "within_6_months" | "within_1_year" | "monitor";
    reasoning: string[];
    marketFactors: {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    };
    financialImplications: {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    };
    riskFactors: string[];
    actionPlan: {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }[];
    expiresAt: Date;
    id?: string | undefined;
}>;
export declare const analysisTemplateSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    propertyType: z.ZodString;
    criteriaPreset: z.ZodObject<{
        strategy: z.ZodEnum<["conservative", "aggressive", "brrrr", "fix_and_flip", "short_term_rental"]>;
        targetCoCReturn: z.ZodNumber;
        targetCapRate: z.ZodNumber;
        maxLoanToValue: z.ZodNumber;
        vacancyRate: z.ZodNumber;
        maintenanceRate: z.ZodNumber;
        managementRate: z.ZodNumber;
        expectedAppreciation: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    }, {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    }>;
    scenarios: z.ZodObject<{
        bestCase: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
        realistic: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
        worstCase: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    }, {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    }>;
    createdAt: z.ZodDate;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    propertyType: string;
    description: string;
    createdAt: Date;
    name: string;
    criteriaPreset: {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
    scenarios: {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    };
    isDefault: boolean;
    id?: string | undefined;
}, {
    propertyType: string;
    description: string;
    createdAt: Date;
    name: string;
    criteriaPreset: {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
    scenarios: {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    };
    id?: string | undefined;
    isDefault?: boolean | undefined;
}>;
export declare const insertNeighborhoodTrendSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    neighborhood: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodOptional<z.ZodString>;
    averagePrice: z.ZodNumber;
    priceChangePercent3Month: z.ZodNumber;
    priceChangePercent6Month: z.ZodNumber;
    priceChangePercent1Year: z.ZodNumber;
    averageRent: z.ZodNumber;
    rentChangePercent3Month: z.ZodNumber;
    rentChangePercent6Month: z.ZodNumber;
    rentChangePercent1Year: z.ZodNumber;
    daysOnMarket: z.ZodNumber;
    pricePerSqft: z.ZodNumber;
    rentYield: z.ZodNumber;
    marketHeat: z.ZodEnum<["hot", "warm", "balanced", "cool", "cold"]>;
    investmentGrade: z.ZodOptional<z.ZodEnum<["A", "B", "C", "D"]>>;
    lastUpdated: z.ZodDate;
}, "id">, "strip", z.ZodTypeAny, {
    city: string;
    state: string;
    neighborhood: string;
    averagePrice: number;
    priceChangePercent3Month: number;
    priceChangePercent6Month: number;
    priceChangePercent1Year: number;
    averageRent: number;
    rentChangePercent3Month: number;
    rentChangePercent6Month: number;
    rentChangePercent1Year: number;
    daysOnMarket: number;
    pricePerSqft: number;
    rentYield: number;
    marketHeat: "hot" | "warm" | "balanced" | "cool" | "cold";
    lastUpdated: Date;
    zipCode?: string | undefined;
    investmentGrade?: "A" | "B" | "C" | "D" | undefined;
}, {
    city: string;
    state: string;
    neighborhood: string;
    averagePrice: number;
    priceChangePercent3Month: number;
    priceChangePercent6Month: number;
    priceChangePercent1Year: number;
    averageRent: number;
    rentChangePercent3Month: number;
    rentChangePercent6Month: number;
    rentChangePercent1Year: number;
    daysOnMarket: number;
    pricePerSqft: number;
    rentYield: number;
    marketHeat: "hot" | "warm" | "balanced" | "cool" | "cold";
    lastUpdated: Date;
    zipCode?: string | undefined;
    investmentGrade?: "A" | "B" | "C" | "D" | undefined;
}>;
export declare const insertComparableSaleSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    address: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    zipCode: z.ZodString;
    salePrice: z.ZodNumber;
    saleDate: z.ZodDate;
    bedrooms: z.ZodNumber;
    bathrooms: z.ZodNumber;
    squareFootage: z.ZodNumber;
    lotSize: z.ZodOptional<z.ZodNumber>;
    yearBuilt: z.ZodNumber;
    propertyType: z.ZodString;
    pricePerSqft: z.ZodNumber;
    distance: z.ZodNumber;
    adjustments: z.ZodOptional<z.ZodObject<{
        size: z.ZodOptional<z.ZodNumber>;
        condition: z.ZodOptional<z.ZodNumber>;
        age: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodNumber>;
        total: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    }, {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    }>>;
    createdAt: z.ZodDate;
}, "id">, "strip", z.ZodTypeAny, {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    createdAt: Date;
    pricePerSqft: number;
    salePrice: number;
    saleDate: Date;
    distance: number;
    lotSize?: number | undefined;
    adjustments?: {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    } | undefined;
}, {
    address: string;
    city: string;
    state: string;
    zipCode: string;
    propertyType: string;
    bedrooms: number;
    bathrooms: number;
    squareFootage: number;
    yearBuilt: number;
    createdAt: Date;
    pricePerSqft: number;
    salePrice: number;
    saleDate: Date;
    distance: number;
    lotSize?: number | undefined;
    adjustments?: {
        total: number;
        location?: number | undefined;
        size?: number | undefined;
        condition?: number | undefined;
        age?: number | undefined;
    } | undefined;
}>;
export declare const insertMarketHeatMapDataSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    zipCode: z.ZodString;
    city: z.ZodString;
    state: z.ZodString;
    latitude: z.ZodNumber;
    longitude: z.ZodNumber;
    averagePrice: z.ZodNumber;
    priceChangePercent: z.ZodNumber;
    averageRent: z.ZodNumber;
    rentChangePercent: z.ZodNumber;
    dealVolume: z.ZodNumber;
    investmentScore: z.ZodNumber;
    heatLevel: z.ZodEnum<["very_hot", "hot", "warm", "balanced", "cool"]>;
    lastUpdated: z.ZodDate;
}, "id">, "strip", z.ZodTypeAny, {
    city: string;
    state: string;
    zipCode: string;
    averagePrice: number;
    averageRent: number;
    lastUpdated: Date;
    latitude: number;
    longitude: number;
    priceChangePercent: number;
    rentChangePercent: number;
    dealVolume: number;
    investmentScore: number;
    heatLevel: "hot" | "warm" | "balanced" | "cool" | "very_hot";
}, {
    city: string;
    state: string;
    zipCode: string;
    averagePrice: number;
    averageRent: number;
    lastUpdated: Date;
    latitude: number;
    longitude: number;
    priceChangePercent: number;
    rentChangePercent: number;
    dealVolume: number;
    investmentScore: number;
    heatLevel: "hot" | "warm" | "balanced" | "cool" | "very_hot";
}>;
export declare const insertSavedFilterSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodOptional<z.ZodString>;
    filterCriteria: z.ZodObject<{
        priceMin: z.ZodOptional<z.ZodNumber>;
        priceMax: z.ZodOptional<z.ZodNumber>;
        bedroomsMin: z.ZodOptional<z.ZodNumber>;
        bedroomsMax: z.ZodOptional<z.ZodNumber>;
        bathroomsMin: z.ZodOptional<z.ZodNumber>;
        bathroomsMax: z.ZodOptional<z.ZodNumber>;
        sqftMin: z.ZodOptional<z.ZodNumber>;
        sqftMax: z.ZodOptional<z.ZodNumber>;
        cocReturnMin: z.ZodOptional<z.ZodNumber>;
        cocReturnMax: z.ZodOptional<z.ZodNumber>;
        capRateMin: z.ZodOptional<z.ZodNumber>;
        capRateMax: z.ZodOptional<z.ZodNumber>;
        cashFlowMin: z.ZodOptional<z.ZodNumber>;
        propertyTypes: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        cities: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        states: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        meetsCriteria: z.ZodOptional<z.ZodBoolean>;
        investmentGrade: z.ZodOptional<z.ZodArray<z.ZodEnum<["A", "B", "C", "D"]>, "many">>;
    }, "strip", z.ZodTypeAny, {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    }, {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    }>;
    userId: z.ZodOptional<z.ZodString>;
    isSystem: z.ZodDefault<z.ZodBoolean>;
    usageCount: z.ZodDefault<z.ZodNumber>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "id" | "createdAt" | "updatedAt">, "strip", z.ZodTypeAny, {
    name: string;
    filterCriteria: {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    };
    isSystem: boolean;
    usageCount: number;
    description?: string | undefined;
    userId?: string | undefined;
}, {
    name: string;
    filterCriteria: {
        meetsCriteria?: boolean | undefined;
        investmentGrade?: ("A" | "B" | "C" | "D")[] | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        cocReturnMin?: number | undefined;
        cashFlowMin?: number | undefined;
        bedroomsMin?: number | undefined;
        bedroomsMax?: number | undefined;
        bathroomsMin?: number | undefined;
        bathroomsMax?: number | undefined;
        sqftMin?: number | undefined;
        sqftMax?: number | undefined;
        cocReturnMax?: number | undefined;
        capRateMin?: number | undefined;
        capRateMax?: number | undefined;
        propertyTypes?: string[] | undefined;
        cities?: string[] | undefined;
        states?: string[] | undefined;
    };
    description?: string | undefined;
    userId?: string | undefined;
    isSystem?: boolean | undefined;
    usageCount?: number | undefined;
}>;
export declare const insertNaturalLanguageSearchSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    query: z.ZodString;
    parsedCriteria: z.ZodObject<{
        bedrooms: z.ZodOptional<z.ZodNumber>;
        bathrooms: z.ZodOptional<z.ZodNumber>;
        priceMax: z.ZodOptional<z.ZodNumber>;
        priceMin: z.ZodOptional<z.ZodNumber>;
        location: z.ZodOptional<z.ZodString>;
        propertyType: z.ZodOptional<z.ZodString>;
        features: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    }, {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    }>;
    resultCount: z.ZodNumber;
    searchDate: z.ZodDate;
}, "id">, "strip", z.ZodTypeAny, {
    query: string;
    parsedCriteria: {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    };
    resultCount: number;
    searchDate: Date;
}, {
    query: string;
    parsedCriteria: {
        propertyType?: string | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        priceMin?: number | undefined;
        priceMax?: number | undefined;
        features?: string[] | undefined;
        location?: string | undefined;
    };
    resultCount: number;
    searchDate: Date;
}>;
export declare const insertSmartPropertyRecommendationSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    sourcePropertyId: z.ZodString;
    recommendedPropertyId: z.ZodString;
    similarityScore: z.ZodNumber;
    matchReasons: z.ZodArray<z.ZodString, "many">;
    recommendationType: z.ZodEnum<["similar_location", "similar_metrics", "upgrade_opportunity", "diversification"]>;
    confidenceScore: z.ZodNumber;
    aiInsights: z.ZodString;
    createdAt: z.ZodDate;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    confidenceScore: number;
    sourcePropertyId: string;
    recommendedPropertyId: string;
    similarityScore: number;
    matchReasons: string[];
    recommendationType: "similar_location" | "similar_metrics" | "upgrade_opportunity" | "diversification";
    aiInsights: string;
}, {
    confidenceScore: number;
    sourcePropertyId: string;
    recommendedPropertyId: string;
    similarityScore: number;
    matchReasons: string[];
    recommendationType: "similar_location" | "similar_metrics" | "upgrade_opportunity" | "diversification";
    aiInsights: string;
}>;
export declare const insertRentPricingRecommendationSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    currentRent: z.ZodNumber;
    recommendedRent: z.ZodNumber;
    adjustmentPercentage: z.ZodNumber;
    adjustmentReasons: z.ZodArray<z.ZodString, "many">;
    marketData: z.ZodObject<{
        areaMedianRent: z.ZodNumber;
        competitorRents: z.ZodArray<z.ZodNumber, "many">;
        seasonalFactors: z.ZodArray<z.ZodString, "many">;
        demandIndicators: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    }, {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    }>;
    riskAssessment: z.ZodObject<{
        tenantRetentionRisk: z.ZodEnum<["low", "medium", "high"]>;
        vacancyRisk: z.ZodEnum<["low", "medium", "high"]>;
        marketRisk: z.ZodEnum<["low", "medium", "high"]>;
    }, "strip", z.ZodTypeAny, {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    }, {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    }>;
    implementation: z.ZodObject<{
        recommendedTiming: z.ZodString;
        gradualIncreaseSchedule: z.ZodOptional<z.ZodArray<z.ZodObject<{
            effectiveDate: z.ZodString;
            newRent: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            effectiveDate: string;
            newRent: number;
        }, {
            effectiveDate: string;
            newRent: number;
        }>, "many">>;
        marketingStrategy: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    }, {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    }>;
    createdAt: z.ZodDate;
    validUntil: z.ZodDate;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    propertyId: string;
    currentRent: number;
    recommendedRent: number;
    adjustmentPercentage: number;
    adjustmentReasons: string[];
    marketData: {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    };
    riskAssessment: {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    };
    implementation: {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    };
    validUntil: Date;
}, {
    propertyId: string;
    currentRent: number;
    recommendedRent: number;
    adjustmentPercentage: number;
    adjustmentReasons: string[];
    marketData: {
        areaMedianRent: number;
        competitorRents: number[];
        seasonalFactors: string[];
        demandIndicators: string[];
    };
    riskAssessment: {
        tenantRetentionRisk: "low" | "medium" | "high";
        vacancyRisk: "low" | "medium" | "high";
        marketRisk: "low" | "medium" | "high";
    };
    implementation: {
        recommendedTiming: string;
        marketingStrategy: string[];
        gradualIncreaseSchedule?: {
            effectiveDate: string;
            newRent: number;
        }[] | undefined;
    };
    validUntil: Date;
}>;
export declare const insertInvestmentTimingAdviceSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    action: z.ZodEnum<["buy", "hold", "sell", "refinance", "improve"]>;
    urgency: z.ZodEnum<["immediate", "within_3_months", "within_6_months", "within_1_year", "monitor"]>;
    reasoning: z.ZodArray<z.ZodString, "many">;
    marketFactors: z.ZodObject<{
        interestRateOutlook: z.ZodString;
        marketCyclePhase: z.ZodEnum<["recovery", "expansion", "peak", "recession"]>;
        localMarketTrends: z.ZodArray<z.ZodString, "many">;
        seasonalConsiderations: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    }, {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    }>;
    financialImplications: z.ZodObject<{
        potentialGainLoss: z.ZodNumber;
        taxConsiderations: z.ZodArray<z.ZodString, "many">;
        cashFlowImpact: z.ZodNumber;
        equityPosition: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    }, {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    }>;
    riskFactors: z.ZodArray<z.ZodString, "many">;
    actionPlan: z.ZodArray<z.ZodObject<{
        step: z.ZodString;
        timeline: z.ZodString;
        priority: z.ZodEnum<["high", "medium", "low"]>;
    }, "strip", z.ZodTypeAny, {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }, {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }>, "many">;
    createdAt: z.ZodDate;
    expiresAt: z.ZodDate;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    propertyId: string;
    action: "buy" | "hold" | "sell" | "refinance" | "improve";
    urgency: "immediate" | "within_3_months" | "within_6_months" | "within_1_year" | "monitor";
    reasoning: string[];
    marketFactors: {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    };
    financialImplications: {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    };
    riskFactors: string[];
    actionPlan: {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }[];
    expiresAt: Date;
}, {
    propertyId: string;
    action: "buy" | "hold" | "sell" | "refinance" | "improve";
    urgency: "immediate" | "within_3_months" | "within_6_months" | "within_1_year" | "monitor";
    reasoning: string[];
    marketFactors: {
        interestRateOutlook: string;
        marketCyclePhase: "recovery" | "expansion" | "peak" | "recession";
        localMarketTrends: string[];
        seasonalConsiderations: string[];
    };
    financialImplications: {
        potentialGainLoss: number;
        taxConsiderations: string[];
        cashFlowImpact: number;
        equityPosition?: number | undefined;
    };
    riskFactors: string[];
    actionPlan: {
        step: string;
        timeline: string;
        priority: "low" | "medium" | "high";
    }[];
    expiresAt: Date;
}>;
export declare const insertAnalysisTemplateSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    name: z.ZodString;
    description: z.ZodString;
    propertyType: z.ZodString;
    criteriaPreset: z.ZodObject<{
        strategy: z.ZodEnum<["conservative", "aggressive", "brrrr", "fix_and_flip", "short_term_rental"]>;
        targetCoCReturn: z.ZodNumber;
        targetCapRate: z.ZodNumber;
        maxLoanToValue: z.ZodNumber;
        vacancyRate: z.ZodNumber;
        maintenanceRate: z.ZodNumber;
        managementRate: z.ZodNumber;
        expectedAppreciation: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    }, {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    }>;
    scenarios: z.ZodObject<{
        bestCase: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
        realistic: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
        worstCase: z.ZodObject<{
            rentIncrease: z.ZodNumber;
            appreciation: z.ZodNumber;
            vacancy: z.ZodNumber;
            maintenance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }, {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        }>;
    }, "strip", z.ZodTypeAny, {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    }, {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    }>;
    createdAt: z.ZodDate;
    isDefault: z.ZodDefault<z.ZodBoolean>;
}, "id" | "createdAt">, "strip", z.ZodTypeAny, {
    propertyType: string;
    description: string;
    name: string;
    criteriaPreset: {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
    scenarios: {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    };
    isDefault: boolean;
}, {
    propertyType: string;
    description: string;
    name: string;
    criteriaPreset: {
        strategy: "conservative" | "aggressive" | "brrrr" | "fix_and_flip" | "short_term_rental";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
    scenarios: {
        bestCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        realistic: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
        worstCase: {
            maintenance: number;
            rentIncrease: number;
            appreciation: number;
            vacancy: number;
        };
    };
    isDefault?: boolean | undefined;
}>;
export type NeighborhoodTrend = z.infer<typeof neighborhoodTrendSchema>;
export type ComparableSale = z.infer<typeof comparableSaleSchema>;
export type MarketHeatMapData = z.infer<typeof marketHeatMapDataSchema>;
export type SavedFilter = z.infer<typeof savedFilterSchema>;
export type NaturalLanguageSearch = z.infer<typeof naturalLanguageSearchSchema>;
export type SmartPropertyRecommendation = z.infer<typeof smartPropertyRecommendationSchema>;
export type RentPricingRecommendation = z.infer<typeof rentPricingRecommendationSchema>;
export type InvestmentTimingAdvice = z.infer<typeof investmentTimingAdviceSchema>;
export type AnalysisTemplate = z.infer<typeof analysisTemplateSchema>;
export type InsertNeighborhoodTrend = z.infer<typeof insertNeighborhoodTrendSchema>;
export type InsertComparableSale = z.infer<typeof insertComparableSaleSchema>;
export type InsertMarketHeatMapData = z.infer<typeof insertMarketHeatMapDataSchema>;
export type InsertSavedFilter = z.infer<typeof insertSavedFilterSchema>;
export type InsertNaturalLanguageSearch = z.infer<typeof insertNaturalLanguageSearchSchema>;
export type InsertSmartPropertyRecommendation = z.infer<typeof insertSmartPropertyRecommendationSchema>;
export type InsertRentPricingRecommendation = z.infer<typeof insertRentPricingRecommendationSchema>;
export type InsertInvestmentTimingAdvice = z.infer<typeof insertInvestmentTimingAdviceSchema>;
export type InsertAnalysisTemplate = z.infer<typeof insertAnalysisTemplateSchema>;
//# sourceMappingURL=market.d.ts.map