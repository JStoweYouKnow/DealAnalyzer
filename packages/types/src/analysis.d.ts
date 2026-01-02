import { z } from "zod";
export declare const aiAnalysisSchema: z.ZodObject<{
    propertyAssessment: z.ZodObject<{
        overallScore: z.ZodNumber;
        strengths: z.ZodArray<z.ZodString, "many">;
        redFlags: z.ZodArray<z.ZodString, "many">;
        description: z.ZodString;
        marketPosition: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        description: string;
        overallScore: number;
        strengths: string[];
        redFlags: string[];
        marketPosition: string;
    }, {
        description: string;
        overallScore: number;
        strengths: string[];
        redFlags: string[];
        marketPosition: string;
    }>;
    marketIntelligence: z.ZodObject<{
        sentimentScore: z.ZodNumber;
        riskLevel: z.ZodEnum<["low", "medium", "high"]>;
        marketTrends: z.ZodArray<z.ZodString, "many">;
        competitiveAnalysis: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        riskLevel: "low" | "medium" | "high";
        sentimentScore: number;
        marketTrends: string[];
        competitiveAnalysis: string;
    }, {
        riskLevel: "low" | "medium" | "high";
        sentimentScore: number;
        marketTrends: string[];
        competitiveAnalysis: string;
    }>;
    investmentRecommendation: z.ZodObject<{
        recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
        confidence: z.ZodNumber;
        reasoning: z.ZodArray<z.ZodString, "many">;
        suggestedStrategy: z.ZodString;
        timeHorizon: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        reasoning: string[];
        confidence: number;
        recommendation: "strong_buy" | "buy" | "hold" | "avoid";
        suggestedStrategy: string;
        timeHorizon: string;
    }, {
        reasoning: string[];
        confidence: number;
        recommendation: "strong_buy" | "buy" | "hold" | "avoid";
        suggestedStrategy: string;
        timeHorizon: string;
    }>;
    predictiveAnalysis: z.ZodObject<{
        appreciationForecast: z.ZodNumber;
        rentGrowthForecast: z.ZodNumber;
        exitStrategy: z.ZodString;
        keyRisks: z.ZodArray<z.ZodString, "many">;
    }, "strip", z.ZodTypeAny, {
        appreciationForecast: number;
        rentGrowthForecast: number;
        exitStrategy: string;
        keyRisks: string[];
    }, {
        appreciationForecast: number;
        rentGrowthForecast: number;
        exitStrategy: string;
        keyRisks: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    propertyAssessment: {
        description: string;
        overallScore: number;
        strengths: string[];
        redFlags: string[];
        marketPosition: string;
    };
    marketIntelligence: {
        riskLevel: "low" | "medium" | "high";
        sentimentScore: number;
        marketTrends: string[];
        competitiveAnalysis: string;
    };
    investmentRecommendation: {
        reasoning: string[];
        confidence: number;
        recommendation: "strong_buy" | "buy" | "hold" | "avoid";
        suggestedStrategy: string;
        timeHorizon: string;
    };
    predictiveAnalysis: {
        appreciationForecast: number;
        rentGrowthForecast: number;
        exitStrategy: string;
        keyRisks: string[];
    };
}, {
    propertyAssessment: {
        description: string;
        overallScore: number;
        strengths: string[];
        redFlags: string[];
        marketPosition: string;
    };
    marketIntelligence: {
        riskLevel: "low" | "medium" | "high";
        sentimentScore: number;
        marketTrends: string[];
        competitiveAnalysis: string;
    };
    investmentRecommendation: {
        reasoning: string[];
        confidence: number;
        recommendation: "strong_buy" | "buy" | "hold" | "avoid";
        suggestedStrategy: string;
        timeHorizon: string;
    };
    predictiveAnalysis: {
        appreciationForecast: number;
        rentGrowthForecast: number;
        exitStrategy: string;
        keyRisks: string[];
    };
}>;
export declare const dealAnalysisSchema: z.ZodObject<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    property: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        address: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        propertyType: z.ZodString;
        purchasePrice: z.ZodNumber;
        monthlyRent: z.ZodNumber;
        bedrooms: z.ZodNumber;
        bathrooms: z.ZodNumber;
        squareFootage: z.ZodNumber;
        lotSize: z.ZodOptional<z.ZodNumber>;
        yearBuilt: z.ZodNumber;
        description: z.ZodString;
        listingUrl: z.ZodString;
        imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            type: z.ZodEnum<["listing", "company", "external", "other"]>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }>, "many">>;
        fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
        adr: z.ZodOptional<z.ZodNumber>;
        occupancyRate: z.ZodOptional<z.ZodNumber>;
        monthlyExpenses: z.ZodOptional<z.ZodObject<{
            propertyTaxes: z.ZodOptional<z.ZodNumber>;
            insurance: z.ZodOptional<z.ZodNumber>;
            utilities: z.ZodOptional<z.ZodNumber>;
            management: z.ZodOptional<z.ZodNumber>;
            maintenance: z.ZodOptional<z.ZodNumber>;
            cleaning: z.ZodOptional<z.ZodNumber>;
            supplies: z.ZodOptional<z.ZodNumber>;
            other: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }>;
    calculatedDownpayment: z.ZodNumber;
    calculatedClosingCosts: z.ZodNumber;
    calculatedInitialFixedCosts: z.ZodNumber;
    estimatedMaintenanceReserve: z.ZodNumber;
    totalCashNeeded: z.ZodNumber;
    passes1PercentRule: z.ZodBoolean;
    cashFlow: z.ZodNumber;
    cashFlowPositive: z.ZodBoolean;
    cocReturn: z.ZodNumber;
    cocMeetsBenchmark: z.ZodBoolean;
    cocMeetsMinimum: z.ZodBoolean;
    capRate: z.ZodNumber;
    capMeetsBenchmark: z.ZodBoolean;
    capMeetsMinimum: z.ZodBoolean;
    projectedAnnualRevenue: z.ZodOptional<z.ZodNumber>;
    projectedGrossYield: z.ZodOptional<z.ZodNumber>;
    totalMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
    strNetIncome: z.ZodOptional<z.ZodNumber>;
    strMeetsCriteria: z.ZodOptional<z.ZodBoolean>;
    meetsCriteria: z.ZodBoolean;
    aiAnalysis: z.ZodOptional<z.ZodObject<{
        propertyAssessment: z.ZodObject<{
            overallScore: z.ZodNumber;
            strengths: z.ZodArray<z.ZodString, "many">;
            redFlags: z.ZodArray<z.ZodString, "many">;
            description: z.ZodString;
            marketPosition: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        }, {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        }>;
        marketIntelligence: z.ZodObject<{
            sentimentScore: z.ZodNumber;
            riskLevel: z.ZodEnum<["low", "medium", "high"]>;
            marketTrends: z.ZodArray<z.ZodString, "many">;
            competitiveAnalysis: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        }, {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        }>;
        investmentRecommendation: z.ZodObject<{
            recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
            confidence: z.ZodNumber;
            reasoning: z.ZodArray<z.ZodString, "many">;
            suggestedStrategy: z.ZodString;
            timeHorizon: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        }, {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        }>;
        predictiveAnalysis: z.ZodObject<{
            appreciationForecast: z.ZodNumber;
            rentGrowthForecast: z.ZodNumber;
            exitStrategy: z.ZodString;
            keyRisks: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        }, {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    }, {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    }>>;
    analysisDate: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    propertyId: string;
    property: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    };
    calculatedDownpayment: number;
    calculatedClosingCosts: number;
    calculatedInitialFixedCosts: number;
    estimatedMaintenanceReserve: number;
    totalCashNeeded: number;
    passes1PercentRule: boolean;
    cashFlow: number;
    cashFlowPositive: boolean;
    cocReturn: number;
    cocMeetsBenchmark: boolean;
    cocMeetsMinimum: boolean;
    capRate: number;
    capMeetsBenchmark: boolean;
    capMeetsMinimum: boolean;
    meetsCriteria: boolean;
    id?: string | undefined;
    analysisDate?: Date | undefined;
    projectedAnnualRevenue?: number | undefined;
    projectedGrossYield?: number | undefined;
    totalMonthlyExpenses?: number | undefined;
    strNetIncome?: number | undefined;
    strMeetsCriteria?: boolean | undefined;
    aiAnalysis?: {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    } | undefined;
}, {
    propertyId: string;
    property: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    };
    calculatedDownpayment: number;
    calculatedClosingCosts: number;
    calculatedInitialFixedCosts: number;
    estimatedMaintenanceReserve: number;
    totalCashNeeded: number;
    passes1PercentRule: boolean;
    cashFlow: number;
    cashFlowPositive: boolean;
    cocReturn: number;
    cocMeetsBenchmark: boolean;
    cocMeetsMinimum: boolean;
    capRate: number;
    capMeetsBenchmark: boolean;
    capMeetsMinimum: boolean;
    meetsCriteria: boolean;
    id?: string | undefined;
    analysisDate?: Date | undefined;
    projectedAnnualRevenue?: number | undefined;
    projectedGrossYield?: number | undefined;
    totalMonthlyExpenses?: number | undefined;
    strNetIncome?: number | undefined;
    strMeetsCriteria?: boolean | undefined;
    aiAnalysis?: {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    } | undefined;
}>;
export declare const analyzePropertyRequestSchema: z.ZodObject<{
    emailContent: z.ZodString;
    fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
    strMetrics: z.ZodOptional<z.ZodObject<{
        adr: z.ZodOptional<z.ZodNumber>;
        occupancyRate: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        adr?: number | undefined;
        occupancyRate?: number | undefined;
    }, {
        adr?: number | undefined;
        occupancyRate?: number | undefined;
    }>>;
    monthlyExpenses: z.ZodOptional<z.ZodObject<{
        propertyTaxes: z.ZodOptional<z.ZodNumber>;
        insurance: z.ZodOptional<z.ZodNumber>;
        utilities: z.ZodOptional<z.ZodNumber>;
        management: z.ZodOptional<z.ZodNumber>;
        maintenance: z.ZodOptional<z.ZodNumber>;
        cleaning: z.ZodOptional<z.ZodNumber>;
        supplies: z.ZodOptional<z.ZodNumber>;
        other: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        other?: number | undefined;
        propertyTaxes?: number | undefined;
        insurance?: number | undefined;
        utilities?: number | undefined;
        management?: number | undefined;
        maintenance?: number | undefined;
        cleaning?: number | undefined;
        supplies?: number | undefined;
    }, {
        other?: number | undefined;
        propertyTaxes?: number | undefined;
        insurance?: number | undefined;
        utilities?: number | undefined;
        management?: number | undefined;
        maintenance?: number | undefined;
        cleaning?: number | undefined;
        supplies?: number | undefined;
    }>>;
    mortgageValues: z.ZodOptional<z.ZodObject<{
        loanAmount: z.ZodNumber;
        loanTermYears: z.ZodNumber;
        monthlyPayment: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        loanAmount: number;
        loanTermYears: number;
        monthlyPayment: number;
    }, {
        loanAmount: number;
        loanTermYears: number;
        monthlyPayment: number;
    }>>;
}, "strip", z.ZodTypeAny, {
    fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
    emailContent: string;
    monthlyExpenses?: {
        other?: number | undefined;
        propertyTaxes?: number | undefined;
        insurance?: number | undefined;
        utilities?: number | undefined;
        management?: number | undefined;
        maintenance?: number | undefined;
        cleaning?: number | undefined;
        supplies?: number | undefined;
    } | undefined;
    strMetrics?: {
        adr?: number | undefined;
        occupancyRate?: number | undefined;
    } | undefined;
    mortgageValues?: {
        loanAmount: number;
        loanTermYears: number;
        monthlyPayment: number;
    } | undefined;
}, {
    emailContent: string;
    fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
    monthlyExpenses?: {
        other?: number | undefined;
        propertyTaxes?: number | undefined;
        insurance?: number | undefined;
        utilities?: number | undefined;
        management?: number | undefined;
        maintenance?: number | undefined;
        cleaning?: number | undefined;
        supplies?: number | undefined;
    } | undefined;
    strMetrics?: {
        adr?: number | undefined;
        occupancyRate?: number | undefined;
    } | undefined;
    mortgageValues?: {
        loanAmount: number;
        loanTermYears: number;
        monthlyPayment: number;
    } | undefined;
}>;
export declare const analyzePropertyResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        propertyId: z.ZodString;
        property: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            address: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            zipCode: z.ZodString;
            propertyType: z.ZodString;
            purchasePrice: z.ZodNumber;
            monthlyRent: z.ZodNumber;
            bedrooms: z.ZodNumber;
            bathrooms: z.ZodNumber;
            squareFootage: z.ZodNumber;
            lotSize: z.ZodOptional<z.ZodNumber>;
            yearBuilt: z.ZodNumber;
            description: z.ZodString;
            listingUrl: z.ZodString;
            imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                type: z.ZodEnum<["listing", "company", "external", "other"]>;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }>, "many">>;
            fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
            adr: z.ZodOptional<z.ZodNumber>;
            occupancyRate: z.ZodOptional<z.ZodNumber>;
            monthlyExpenses: z.ZodOptional<z.ZodObject<{
                propertyTaxes: z.ZodOptional<z.ZodNumber>;
                insurance: z.ZodOptional<z.ZodNumber>;
                utilities: z.ZodOptional<z.ZodNumber>;
                management: z.ZodOptional<z.ZodNumber>;
                maintenance: z.ZodOptional<z.ZodNumber>;
                cleaning: z.ZodOptional<z.ZodNumber>;
                supplies: z.ZodOptional<z.ZodNumber>;
                other: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            }, {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        }, {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        }>;
        calculatedDownpayment: z.ZodNumber;
        calculatedClosingCosts: z.ZodNumber;
        calculatedInitialFixedCosts: z.ZodNumber;
        estimatedMaintenanceReserve: z.ZodNumber;
        totalCashNeeded: z.ZodNumber;
        passes1PercentRule: z.ZodBoolean;
        cashFlow: z.ZodNumber;
        cashFlowPositive: z.ZodBoolean;
        cocReturn: z.ZodNumber;
        cocMeetsBenchmark: z.ZodBoolean;
        cocMeetsMinimum: z.ZodBoolean;
        capRate: z.ZodNumber;
        capMeetsBenchmark: z.ZodBoolean;
        capMeetsMinimum: z.ZodBoolean;
        projectedAnnualRevenue: z.ZodOptional<z.ZodNumber>;
        projectedGrossYield: z.ZodOptional<z.ZodNumber>;
        totalMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
        strNetIncome: z.ZodOptional<z.ZodNumber>;
        strMeetsCriteria: z.ZodOptional<z.ZodBoolean>;
        meetsCriteria: z.ZodBoolean;
        aiAnalysis: z.ZodOptional<z.ZodObject<{
            propertyAssessment: z.ZodObject<{
                overallScore: z.ZodNumber;
                strengths: z.ZodArray<z.ZodString, "many">;
                redFlags: z.ZodArray<z.ZodString, "many">;
                description: z.ZodString;
                marketPosition: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            }, {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            }>;
            marketIntelligence: z.ZodObject<{
                sentimentScore: z.ZodNumber;
                riskLevel: z.ZodEnum<["low", "medium", "high"]>;
                marketTrends: z.ZodArray<z.ZodString, "many">;
                competitiveAnalysis: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            }, {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            }>;
            investmentRecommendation: z.ZodObject<{
                recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
                confidence: z.ZodNumber;
                reasoning: z.ZodArray<z.ZodString, "many">;
                suggestedStrategy: z.ZodString;
                timeHorizon: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            }, {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            }>;
            predictiveAnalysis: z.ZodObject<{
                appreciationForecast: z.ZodNumber;
                rentGrowthForecast: z.ZodNumber;
                exitStrategy: z.ZodString;
                keyRisks: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            }, {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        }, {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        }>>;
        analysisDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }, {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    } | undefined;
    error?: string | undefined;
}, {
    success: boolean;
    data?: {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    } | undefined;
    error?: string | undefined;
}>;
export declare const criteriaResponseSchema: z.ZodObject<{
    property_types: z.ZodArray<z.ZodString, "many">;
    location: z.ZodString;
    min_purchase_price: z.ZodNumber;
    max_purchase_price: z.ZodNumber;
    downpayment_percentage_min: z.ZodNumber;
    downpayment_percentage_max: z.ZodNumber;
    closing_costs_percentage_min: z.ZodNumber;
    closing_costs_percentage_max: z.ZodNumber;
    initial_fixed_costs_percentage: z.ZodNumber;
    maintenance_reserve_percentage: z.ZodNumber;
    coc_benchmark_min: z.ZodNumber;
    coc_benchmark_max: z.ZodNumber;
    coc_minimum_min: z.ZodNumber;
    coc_minimum_max: z.ZodNumber;
    cap_benchmark_min: z.ZodNumber;
    cap_benchmark_max: z.ZodNumber;
    cap_minimum: z.ZodNumber;
    str_adr_minimum: z.ZodOptional<z.ZodNumber>;
    str_occupancy_rate_minimum: z.ZodOptional<z.ZodNumber>;
    str_gross_yield_minimum: z.ZodOptional<z.ZodNumber>;
    str_annual_revenue_minimum: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_purchase_price: number;
    coc_minimum_min: number;
    coc_minimum_max: number;
    coc_benchmark_min: number;
    coc_benchmark_max: number;
    cap_minimum: number;
    cap_benchmark_min: number;
    cap_benchmark_max: number;
    property_types: string[];
    location: string;
    min_purchase_price: number;
    downpayment_percentage_min: number;
    downpayment_percentage_max: number;
    closing_costs_percentage_min: number;
    closing_costs_percentage_max: number;
    initial_fixed_costs_percentage: number;
    maintenance_reserve_percentage: number;
    str_adr_minimum?: number | undefined;
    str_occupancy_rate_minimum?: number | undefined;
    str_gross_yield_minimum?: number | undefined;
    str_annual_revenue_minimum?: number | undefined;
}, {
    max_purchase_price: number;
    coc_minimum_min: number;
    coc_minimum_max: number;
    coc_benchmark_min: number;
    coc_benchmark_max: number;
    cap_minimum: number;
    cap_benchmark_min: number;
    cap_benchmark_max: number;
    property_types: string[];
    location: string;
    min_purchase_price: number;
    downpayment_percentage_min: number;
    downpayment_percentage_max: number;
    closing_costs_percentage_min: number;
    closing_costs_percentage_max: number;
    initial_fixed_costs_percentage: number;
    maintenance_reserve_percentage: number;
    str_adr_minimum?: number | undefined;
    str_occupancy_rate_minimum?: number | undefined;
    str_gross_yield_minimum?: number | undefined;
    str_annual_revenue_minimum?: number | undefined;
}>;
export declare const configurableCriteriaSchema: z.ZodEffects<z.ZodObject<{
    price_min: z.ZodNumber;
    price_max: z.ZodNumber;
    coc_return: z.ZodNumber;
    coc_benchmark: z.ZodOptional<z.ZodNumber>;
    coc_minimum: z.ZodOptional<z.ZodNumber>;
    cap_rate: z.ZodNumber;
    cap_benchmark: z.ZodOptional<z.ZodNumber>;
    cap_minimum: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    price_min: number;
    price_max: number;
    coc_return: number;
    cap_rate: number;
    cap_minimum?: number | undefined;
    coc_benchmark?: number | undefined;
    coc_minimum?: number | undefined;
    cap_benchmark?: number | undefined;
}, {
    price_min: number;
    price_max: number;
    coc_return: number;
    cap_rate: number;
    cap_minimum?: number | undefined;
    coc_benchmark?: number | undefined;
    coc_minimum?: number | undefined;
    cap_benchmark?: number | undefined;
}>, {
    price_min: number;
    price_max: number;
    coc_return: number;
    cap_rate: number;
    cap_minimum?: number | undefined;
    coc_benchmark?: number | undefined;
    coc_minimum?: number | undefined;
    cap_benchmark?: number | undefined;
}, {
    price_min: number;
    price_max: number;
    coc_return: number;
    cap_rate: number;
    cap_minimum?: number | undefined;
    coc_benchmark?: number | undefined;
    coc_minimum?: number | undefined;
    cap_benchmark?: number | undefined;
}>;
export declare const updateCriteriaRequestSchema: z.ZodObject<{
    criteria: z.ZodEffects<z.ZodObject<{
        price_min: z.ZodNumber;
        price_max: z.ZodNumber;
        coc_return: z.ZodNumber;
        coc_benchmark: z.ZodOptional<z.ZodNumber>;
        coc_minimum: z.ZodOptional<z.ZodNumber>;
        cap_rate: z.ZodNumber;
        cap_benchmark: z.ZodOptional<z.ZodNumber>;
        cap_minimum: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    }, {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    }>, {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    }, {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    criteria: {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    };
}, {
    criteria: {
        price_min: number;
        price_max: number;
        coc_return: number;
        cap_rate: number;
        cap_minimum?: number | undefined;
        coc_benchmark?: number | undefined;
        coc_minimum?: number | undefined;
        cap_benchmark?: number | undefined;
    };
}>;
export declare const propertyComparisonSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodOptional<z.ZodString>;
    properties: z.ZodArray<z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        propertyId: z.ZodString;
        property: z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            address: z.ZodString;
            city: z.ZodString;
            state: z.ZodString;
            zipCode: z.ZodString;
            propertyType: z.ZodString;
            purchasePrice: z.ZodNumber;
            monthlyRent: z.ZodNumber;
            bedrooms: z.ZodNumber;
            bathrooms: z.ZodNumber;
            squareFootage: z.ZodNumber;
            lotSize: z.ZodOptional<z.ZodNumber>;
            yearBuilt: z.ZodNumber;
            description: z.ZodString;
            listingUrl: z.ZodString;
            imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                type: z.ZodEnum<["listing", "company", "external", "other"]>;
                description: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }>, "many">>;
            fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
            adr: z.ZodOptional<z.ZodNumber>;
            occupancyRate: z.ZodOptional<z.ZodNumber>;
            monthlyExpenses: z.ZodOptional<z.ZodObject<{
                propertyTaxes: z.ZodOptional<z.ZodNumber>;
                insurance: z.ZodOptional<z.ZodNumber>;
                utilities: z.ZodOptional<z.ZodNumber>;
                management: z.ZodOptional<z.ZodNumber>;
                maintenance: z.ZodOptional<z.ZodNumber>;
                cleaning: z.ZodOptional<z.ZodNumber>;
                supplies: z.ZodOptional<z.ZodNumber>;
                other: z.ZodOptional<z.ZodNumber>;
            }, "strip", z.ZodTypeAny, {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            }, {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            }>>;
        }, "strip", z.ZodTypeAny, {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        }, {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        }>;
        calculatedDownpayment: z.ZodNumber;
        calculatedClosingCosts: z.ZodNumber;
        calculatedInitialFixedCosts: z.ZodNumber;
        estimatedMaintenanceReserve: z.ZodNumber;
        totalCashNeeded: z.ZodNumber;
        passes1PercentRule: z.ZodBoolean;
        cashFlow: z.ZodNumber;
        cashFlowPositive: z.ZodBoolean;
        cocReturn: z.ZodNumber;
        cocMeetsBenchmark: z.ZodBoolean;
        cocMeetsMinimum: z.ZodBoolean;
        capRate: z.ZodNumber;
        capMeetsBenchmark: z.ZodBoolean;
        capMeetsMinimum: z.ZodBoolean;
        projectedAnnualRevenue: z.ZodOptional<z.ZodNumber>;
        projectedGrossYield: z.ZodOptional<z.ZodNumber>;
        totalMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
        strNetIncome: z.ZodOptional<z.ZodNumber>;
        strMeetsCriteria: z.ZodOptional<z.ZodBoolean>;
        meetsCriteria: z.ZodBoolean;
        aiAnalysis: z.ZodOptional<z.ZodObject<{
            propertyAssessment: z.ZodObject<{
                overallScore: z.ZodNumber;
                strengths: z.ZodArray<z.ZodString, "many">;
                redFlags: z.ZodArray<z.ZodString, "many">;
                description: z.ZodString;
                marketPosition: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            }, {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            }>;
            marketIntelligence: z.ZodObject<{
                sentimentScore: z.ZodNumber;
                riskLevel: z.ZodEnum<["low", "medium", "high"]>;
                marketTrends: z.ZodArray<z.ZodString, "many">;
                competitiveAnalysis: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            }, {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            }>;
            investmentRecommendation: z.ZodObject<{
                recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
                confidence: z.ZodNumber;
                reasoning: z.ZodArray<z.ZodString, "many">;
                suggestedStrategy: z.ZodString;
                timeHorizon: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            }, {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            }>;
            predictiveAnalysis: z.ZodObject<{
                appreciationForecast: z.ZodNumber;
                rentGrowthForecast: z.ZodNumber;
                exitStrategy: z.ZodString;
                keyRisks: z.ZodArray<z.ZodString, "many">;
            }, "strip", z.ZodTypeAny, {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            }, {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            }>;
        }, "strip", z.ZodTypeAny, {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        }, {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        }>>;
        analysisDate: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }, {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }>, "many">;
    createdAt: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    id: string;
    properties: {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }[];
    createdAt?: Date | undefined;
    name?: string | undefined;
}, {
    id: string;
    properties: {
        propertyId: string;
        property: {
            address: string;
            city: string;
            state: string;
            zipCode: string;
            propertyType: string;
            purchasePrice: number;
            monthlyRent: number;
            bedrooms: number;
            bathrooms: number;
            squareFootage: number;
            yearBuilt: number;
            description: string;
            listingUrl: string;
            id?: string | undefined;
            lotSize?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
            }[] | undefined;
            fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            monthlyExpenses?: {
                other?: number | undefined;
                propertyTaxes?: number | undefined;
                insurance?: number | undefined;
                utilities?: number | undefined;
                management?: number | undefined;
                maintenance?: number | undefined;
                cleaning?: number | undefined;
                supplies?: number | undefined;
            } | undefined;
        };
        calculatedDownpayment: number;
        calculatedClosingCosts: number;
        calculatedInitialFixedCosts: number;
        estimatedMaintenanceReserve: number;
        totalCashNeeded: number;
        passes1PercentRule: boolean;
        cashFlow: number;
        cashFlowPositive: boolean;
        cocReturn: number;
        cocMeetsBenchmark: boolean;
        cocMeetsMinimum: boolean;
        capRate: number;
        capMeetsBenchmark: boolean;
        capMeetsMinimum: boolean;
        meetsCriteria: boolean;
        id?: string | undefined;
        analysisDate?: Date | undefined;
        projectedAnnualRevenue?: number | undefined;
        projectedGrossYield?: number | undefined;
        totalMonthlyExpenses?: number | undefined;
        strNetIncome?: number | undefined;
        strMeetsCriteria?: boolean | undefined;
        aiAnalysis?: {
            propertyAssessment: {
                description: string;
                overallScore: number;
                strengths: string[];
                redFlags: string[];
                marketPosition: string;
            };
            marketIntelligence: {
                riskLevel: "low" | "medium" | "high";
                sentimentScore: number;
                marketTrends: string[];
                competitiveAnalysis: string;
            };
            investmentRecommendation: {
                reasoning: string[];
                confidence: number;
                recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                suggestedStrategy: string;
                timeHorizon: string;
            };
            predictiveAnalysis: {
                appreciationForecast: number;
                rentGrowthForecast: number;
                exitStrategy: string;
                keyRisks: string[];
            };
        } | undefined;
    }[];
    createdAt?: Date | undefined;
    name?: string | undefined;
}>;
export declare const createComparisonRequestSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    propertyIds: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    propertyIds: string[];
    name?: string | undefined;
}, {
    propertyIds: string[];
    name?: string | undefined;
}>;
export declare const comparisonResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodOptional<z.ZodString>;
        properties: z.ZodArray<z.ZodObject<{
            id: z.ZodOptional<z.ZodString>;
            propertyId: z.ZodString;
            property: z.ZodObject<{
                id: z.ZodOptional<z.ZodString>;
                address: z.ZodString;
                city: z.ZodString;
                state: z.ZodString;
                zipCode: z.ZodString;
                propertyType: z.ZodString;
                purchasePrice: z.ZodNumber;
                monthlyRent: z.ZodNumber;
                bedrooms: z.ZodNumber;
                bathrooms: z.ZodNumber;
                squareFootage: z.ZodNumber;
                lotSize: z.ZodOptional<z.ZodNumber>;
                yearBuilt: z.ZodNumber;
                description: z.ZodString;
                listingUrl: z.ZodString;
                imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
                sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                    url: z.ZodString;
                    type: z.ZodEnum<["listing", "company", "external", "other"]>;
                    description: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }, {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }>, "many">>;
                fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
                adr: z.ZodOptional<z.ZodNumber>;
                occupancyRate: z.ZodOptional<z.ZodNumber>;
                monthlyExpenses: z.ZodOptional<z.ZodObject<{
                    propertyTaxes: z.ZodOptional<z.ZodNumber>;
                    insurance: z.ZodOptional<z.ZodNumber>;
                    utilities: z.ZodOptional<z.ZodNumber>;
                    management: z.ZodOptional<z.ZodNumber>;
                    maintenance: z.ZodOptional<z.ZodNumber>;
                    cleaning: z.ZodOptional<z.ZodNumber>;
                    supplies: z.ZodOptional<z.ZodNumber>;
                    other: z.ZodOptional<z.ZodNumber>;
                }, "strip", z.ZodTypeAny, {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                }, {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                }>>;
            }, "strip", z.ZodTypeAny, {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            }, {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            }>;
            calculatedDownpayment: z.ZodNumber;
            calculatedClosingCosts: z.ZodNumber;
            calculatedInitialFixedCosts: z.ZodNumber;
            estimatedMaintenanceReserve: z.ZodNumber;
            totalCashNeeded: z.ZodNumber;
            passes1PercentRule: z.ZodBoolean;
            cashFlow: z.ZodNumber;
            cashFlowPositive: z.ZodBoolean;
            cocReturn: z.ZodNumber;
            cocMeetsBenchmark: z.ZodBoolean;
            cocMeetsMinimum: z.ZodBoolean;
            capRate: z.ZodNumber;
            capMeetsBenchmark: z.ZodBoolean;
            capMeetsMinimum: z.ZodBoolean;
            projectedAnnualRevenue: z.ZodOptional<z.ZodNumber>;
            projectedGrossYield: z.ZodOptional<z.ZodNumber>;
            totalMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
            strNetIncome: z.ZodOptional<z.ZodNumber>;
            strMeetsCriteria: z.ZodOptional<z.ZodBoolean>;
            meetsCriteria: z.ZodBoolean;
            aiAnalysis: z.ZodOptional<z.ZodObject<{
                propertyAssessment: z.ZodObject<{
                    overallScore: z.ZodNumber;
                    strengths: z.ZodArray<z.ZodString, "many">;
                    redFlags: z.ZodArray<z.ZodString, "many">;
                    description: z.ZodString;
                    marketPosition: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                }, {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                }>;
                marketIntelligence: z.ZodObject<{
                    sentimentScore: z.ZodNumber;
                    riskLevel: z.ZodEnum<["low", "medium", "high"]>;
                    marketTrends: z.ZodArray<z.ZodString, "many">;
                    competitiveAnalysis: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                }, {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                }>;
                investmentRecommendation: z.ZodObject<{
                    recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
                    confidence: z.ZodNumber;
                    reasoning: z.ZodArray<z.ZodString, "many">;
                    suggestedStrategy: z.ZodString;
                    timeHorizon: z.ZodString;
                }, "strip", z.ZodTypeAny, {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                }, {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                }>;
                predictiveAnalysis: z.ZodObject<{
                    appreciationForecast: z.ZodNumber;
                    rentGrowthForecast: z.ZodNumber;
                    exitStrategy: z.ZodString;
                    keyRisks: z.ZodArray<z.ZodString, "many">;
                }, "strip", z.ZodTypeAny, {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                }, {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                }>;
            }, "strip", z.ZodTypeAny, {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            }, {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            }>>;
            analysisDate: z.ZodOptional<z.ZodDate>;
        }, "strip", z.ZodTypeAny, {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }, {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }>, "many">;
        createdAt: z.ZodOptional<z.ZodDate>;
    }, "strip", z.ZodTypeAny, {
        id: string;
        properties: {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }[];
        createdAt?: Date | undefined;
        name?: string | undefined;
    }, {
        id: string;
        properties: {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }[];
        createdAt?: Date | undefined;
        name?: string | undefined;
    }>>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: {
        id: string;
        properties: {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }[];
        createdAt?: Date | undefined;
        name?: string | undefined;
    } | undefined;
    error?: string | undefined;
}, {
    success: boolean;
    data?: {
        id: string;
        properties: {
            propertyId: string;
            property: {
                address: string;
                city: string;
                state: string;
                zipCode: string;
                propertyType: string;
                purchasePrice: number;
                monthlyRent: number;
                bedrooms: number;
                bathrooms: number;
                squareFootage: number;
                yearBuilt: number;
                description: string;
                listingUrl: string;
                id?: string | undefined;
                lotSize?: number | undefined;
                imageUrls?: string[] | undefined;
                sourceLinks?: {
                    url: string;
                    type: "listing" | "company" | "external" | "other";
                    description?: string | undefined;
                }[] | undefined;
                fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
                adr?: number | undefined;
                occupancyRate?: number | undefined;
                monthlyExpenses?: {
                    other?: number | undefined;
                    propertyTaxes?: number | undefined;
                    insurance?: number | undefined;
                    utilities?: number | undefined;
                    management?: number | undefined;
                    maintenance?: number | undefined;
                    cleaning?: number | undefined;
                    supplies?: number | undefined;
                } | undefined;
            };
            calculatedDownpayment: number;
            calculatedClosingCosts: number;
            calculatedInitialFixedCosts: number;
            estimatedMaintenanceReserve: number;
            totalCashNeeded: number;
            passes1PercentRule: boolean;
            cashFlow: number;
            cashFlowPositive: boolean;
            cocReturn: number;
            cocMeetsBenchmark: boolean;
            cocMeetsMinimum: boolean;
            capRate: number;
            capMeetsBenchmark: boolean;
            capMeetsMinimum: boolean;
            meetsCriteria: boolean;
            id?: string | undefined;
            analysisDate?: Date | undefined;
            projectedAnnualRevenue?: number | undefined;
            projectedGrossYield?: number | undefined;
            totalMonthlyExpenses?: number | undefined;
            strNetIncome?: number | undefined;
            strMeetsCriteria?: boolean | undefined;
            aiAnalysis?: {
                propertyAssessment: {
                    description: string;
                    overallScore: number;
                    strengths: string[];
                    redFlags: string[];
                    marketPosition: string;
                };
                marketIntelligence: {
                    riskLevel: "low" | "medium" | "high";
                    sentimentScore: number;
                    marketTrends: string[];
                    competitiveAnalysis: string;
                };
                investmentRecommendation: {
                    reasoning: string[];
                    confidence: number;
                    recommendation: "strong_buy" | "buy" | "hold" | "avoid";
                    suggestedStrategy: string;
                    timeHorizon: string;
                };
                predictiveAnalysis: {
                    appreciationForecast: number;
                    rentGrowthForecast: number;
                    exitStrategy: string;
                    keyRisks: string[];
                };
            } | undefined;
        }[];
        createdAt?: Date | undefined;
        name?: string | undefined;
    } | undefined;
    error?: string | undefined;
}>;
export declare const propertyClassificationSchema: z.ZodObject<{
    propertyId: z.ZodString;
    investmentGrade: z.ZodEnum<["A", "B", "C", "D"]>;
    classificationReasons: z.ZodArray<z.ZodString, "many">;
    confidenceScore: z.ZodNumber;
    factors: z.ZodObject<{
        locationScore: z.ZodNumber;
        conditionScore: z.ZodNumber;
        marketScore: z.ZodNumber;
        financialScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    }, {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    }>;
    lastUpdated: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    propertyId: string;
    investmentGrade: "A" | "B" | "C" | "D";
    lastUpdated: Date;
    classificationReasons: string[];
    confidenceScore: number;
    factors: {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    };
}, {
    propertyId: string;
    investmentGrade: "A" | "B" | "C" | "D";
    lastUpdated: Date;
    classificationReasons: string[];
    confidenceScore: number;
    factors: {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    };
}>;
export declare const photoAnalysisSchema: z.ZodObject<{
    id: z.ZodString;
    propertyId: z.ZodString;
    filename: z.ZodString;
    url: z.ZodString;
    aiScore: z.ZodNumber;
    qualityScore: z.ZodNumber;
    compositionScore: z.ZodNumber;
    lightingScore: z.ZodNumber;
    propertyConditionScore: z.ZodNumber;
    insights: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    tags: z.ZodArray<z.ZodString, "many">;
    roomType: z.ZodOptional<z.ZodString>;
    marketability: z.ZodEnum<["high", "medium", "low"]>;
    analysisDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    url: string;
    id: string;
    analysisDate: string;
    propertyId: string;
    filename: string;
    aiScore: number;
    qualityScore: number;
    compositionScore: number;
    lightingScore: number;
    propertyConditionScore: number;
    insights: string[];
    suggestions: string[];
    tags: string[];
    marketability: "low" | "medium" | "high";
    roomType?: string | undefined;
}, {
    url: string;
    id: string;
    analysisDate: string;
    propertyId: string;
    filename: string;
    aiScore: number;
    qualityScore: number;
    compositionScore: number;
    lightingScore: number;
    propertyConditionScore: number;
    insights: string[];
    suggestions: string[];
    tags: string[];
    marketability: "low" | "medium" | "high";
    roomType?: string | undefined;
}>;
export declare const insertDealAnalysisSchema: z.ZodObject<Omit<{
    id: z.ZodOptional<z.ZodString>;
    propertyId: z.ZodString;
    property: z.ZodObject<{
        id: z.ZodOptional<z.ZodString>;
        address: z.ZodString;
        city: z.ZodString;
        state: z.ZodString;
        zipCode: z.ZodString;
        propertyType: z.ZodString;
        purchasePrice: z.ZodNumber;
        monthlyRent: z.ZodNumber;
        bedrooms: z.ZodNumber;
        bathrooms: z.ZodNumber;
        squareFootage: z.ZodNumber;
        lotSize: z.ZodOptional<z.ZodNumber>;
        yearBuilt: z.ZodNumber;
        description: z.ZodString;
        listingUrl: z.ZodString;
        imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            type: z.ZodEnum<["listing", "company", "external", "other"]>;
            description: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }>, "many">>;
        fundingSource: z.ZodDefault<z.ZodOptional<z.ZodEnum<["conventional", "fha", "va", "dscr", "cash"]>>>;
        adr: z.ZodOptional<z.ZodNumber>;
        occupancyRate: z.ZodOptional<z.ZodNumber>;
        monthlyExpenses: z.ZodOptional<z.ZodObject<{
            propertyTaxes: z.ZodOptional<z.ZodNumber>;
            insurance: z.ZodOptional<z.ZodNumber>;
            utilities: z.ZodOptional<z.ZodNumber>;
            management: z.ZodOptional<z.ZodNumber>;
            maintenance: z.ZodOptional<z.ZodNumber>;
            cleaning: z.ZodOptional<z.ZodNumber>;
            supplies: z.ZodOptional<z.ZodNumber>;
            other: z.ZodOptional<z.ZodNumber>;
        }, "strip", z.ZodTypeAny, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }, {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        }>>;
    }, "strip", z.ZodTypeAny, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }, {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    }>;
    calculatedDownpayment: z.ZodNumber;
    calculatedClosingCosts: z.ZodNumber;
    calculatedInitialFixedCosts: z.ZodNumber;
    estimatedMaintenanceReserve: z.ZodNumber;
    totalCashNeeded: z.ZodNumber;
    passes1PercentRule: z.ZodBoolean;
    cashFlow: z.ZodNumber;
    cashFlowPositive: z.ZodBoolean;
    cocReturn: z.ZodNumber;
    cocMeetsBenchmark: z.ZodBoolean;
    cocMeetsMinimum: z.ZodBoolean;
    capRate: z.ZodNumber;
    capMeetsBenchmark: z.ZodBoolean;
    capMeetsMinimum: z.ZodBoolean;
    projectedAnnualRevenue: z.ZodOptional<z.ZodNumber>;
    projectedGrossYield: z.ZodOptional<z.ZodNumber>;
    totalMonthlyExpenses: z.ZodOptional<z.ZodNumber>;
    strNetIncome: z.ZodOptional<z.ZodNumber>;
    strMeetsCriteria: z.ZodOptional<z.ZodBoolean>;
    meetsCriteria: z.ZodBoolean;
    aiAnalysis: z.ZodOptional<z.ZodObject<{
        propertyAssessment: z.ZodObject<{
            overallScore: z.ZodNumber;
            strengths: z.ZodArray<z.ZodString, "many">;
            redFlags: z.ZodArray<z.ZodString, "many">;
            description: z.ZodString;
            marketPosition: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        }, {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        }>;
        marketIntelligence: z.ZodObject<{
            sentimentScore: z.ZodNumber;
            riskLevel: z.ZodEnum<["low", "medium", "high"]>;
            marketTrends: z.ZodArray<z.ZodString, "many">;
            competitiveAnalysis: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        }, {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        }>;
        investmentRecommendation: z.ZodObject<{
            recommendation: z.ZodEnum<["strong_buy", "buy", "hold", "avoid"]>;
            confidence: z.ZodNumber;
            reasoning: z.ZodArray<z.ZodString, "many">;
            suggestedStrategy: z.ZodString;
            timeHorizon: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        }, {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        }>;
        predictiveAnalysis: z.ZodObject<{
            appreciationForecast: z.ZodNumber;
            rentGrowthForecast: z.ZodNumber;
            exitStrategy: z.ZodString;
            keyRisks: z.ZodArray<z.ZodString, "many">;
        }, "strip", z.ZodTypeAny, {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        }, {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    }, {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    }>>;
    analysisDate: z.ZodOptional<z.ZodDate>;
}, "id" | "analysisDate">, "strip", z.ZodTypeAny, {
    propertyId: string;
    property: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        fundingSource: "conventional" | "fha" | "va" | "dscr" | "cash";
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    };
    calculatedDownpayment: number;
    calculatedClosingCosts: number;
    calculatedInitialFixedCosts: number;
    estimatedMaintenanceReserve: number;
    totalCashNeeded: number;
    passes1PercentRule: boolean;
    cashFlow: number;
    cashFlowPositive: boolean;
    cocReturn: number;
    cocMeetsBenchmark: boolean;
    cocMeetsMinimum: boolean;
    capRate: number;
    capMeetsBenchmark: boolean;
    capMeetsMinimum: boolean;
    meetsCriteria: boolean;
    projectedAnnualRevenue?: number | undefined;
    projectedGrossYield?: number | undefined;
    totalMonthlyExpenses?: number | undefined;
    strNetIncome?: number | undefined;
    strMeetsCriteria?: boolean | undefined;
    aiAnalysis?: {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    } | undefined;
}, {
    propertyId: string;
    property: {
        address: string;
        city: string;
        state: string;
        zipCode: string;
        propertyType: string;
        purchasePrice: number;
        monthlyRent: number;
        bedrooms: number;
        bathrooms: number;
        squareFootage: number;
        yearBuilt: number;
        description: string;
        listingUrl: string;
        id?: string | undefined;
        lotSize?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
        }[] | undefined;
        fundingSource?: "conventional" | "fha" | "va" | "dscr" | "cash" | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        monthlyExpenses?: {
            other?: number | undefined;
            propertyTaxes?: number | undefined;
            insurance?: number | undefined;
            utilities?: number | undefined;
            management?: number | undefined;
            maintenance?: number | undefined;
            cleaning?: number | undefined;
            supplies?: number | undefined;
        } | undefined;
    };
    calculatedDownpayment: number;
    calculatedClosingCosts: number;
    calculatedInitialFixedCosts: number;
    estimatedMaintenanceReserve: number;
    totalCashNeeded: number;
    passes1PercentRule: boolean;
    cashFlow: number;
    cashFlowPositive: boolean;
    cocReturn: number;
    cocMeetsBenchmark: boolean;
    cocMeetsMinimum: boolean;
    capRate: number;
    capMeetsBenchmark: boolean;
    capMeetsMinimum: boolean;
    meetsCriteria: boolean;
    projectedAnnualRevenue?: number | undefined;
    projectedGrossYield?: number | undefined;
    totalMonthlyExpenses?: number | undefined;
    strNetIncome?: number | undefined;
    strMeetsCriteria?: boolean | undefined;
    aiAnalysis?: {
        propertyAssessment: {
            description: string;
            overallScore: number;
            strengths: string[];
            redFlags: string[];
            marketPosition: string;
        };
        marketIntelligence: {
            riskLevel: "low" | "medium" | "high";
            sentimentScore: number;
            marketTrends: string[];
            competitiveAnalysis: string;
        };
        investmentRecommendation: {
            reasoning: string[];
            confidence: number;
            recommendation: "strong_buy" | "buy" | "hold" | "avoid";
            suggestedStrategy: string;
            timeHorizon: string;
        };
        predictiveAnalysis: {
            appreciationForecast: number;
            rentGrowthForecast: number;
            exitStrategy: string;
            keyRisks: string[];
        };
    } | undefined;
}>;
export declare const insertPropertyClassificationSchema: z.ZodObject<Omit<{
    propertyId: z.ZodString;
    investmentGrade: z.ZodEnum<["A", "B", "C", "D"]>;
    classificationReasons: z.ZodArray<z.ZodString, "many">;
    confidenceScore: z.ZodNumber;
    factors: z.ZodObject<{
        locationScore: z.ZodNumber;
        conditionScore: z.ZodNumber;
        marketScore: z.ZodNumber;
        financialScore: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    }, {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    }>;
    lastUpdated: z.ZodDate;
}, never>, "strip", z.ZodTypeAny, {
    propertyId: string;
    investmentGrade: "A" | "B" | "C" | "D";
    lastUpdated: Date;
    classificationReasons: string[];
    confidenceScore: number;
    factors: {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    };
}, {
    propertyId: string;
    investmentGrade: "A" | "B" | "C" | "D";
    lastUpdated: Date;
    classificationReasons: string[];
    confidenceScore: number;
    factors: {
        locationScore: number;
        conditionScore: number;
        marketScore: number;
        financialScore: number;
    };
}>;
export declare const insertPhotoAnalysisSchema: z.ZodObject<Omit<{
    id: z.ZodString;
    propertyId: z.ZodString;
    filename: z.ZodString;
    url: z.ZodString;
    aiScore: z.ZodNumber;
    qualityScore: z.ZodNumber;
    compositionScore: z.ZodNumber;
    lightingScore: z.ZodNumber;
    propertyConditionScore: z.ZodNumber;
    insights: z.ZodArray<z.ZodString, "many">;
    suggestions: z.ZodArray<z.ZodString, "many">;
    tags: z.ZodArray<z.ZodString, "many">;
    roomType: z.ZodOptional<z.ZodString>;
    marketability: z.ZodEnum<["high", "medium", "low"]>;
    analysisDate: z.ZodString;
}, "id">, "strip", z.ZodTypeAny, {
    url: string;
    analysisDate: string;
    propertyId: string;
    filename: string;
    aiScore: number;
    qualityScore: number;
    compositionScore: number;
    lightingScore: number;
    propertyConditionScore: number;
    insights: string[];
    suggestions: string[];
    tags: string[];
    marketability: "low" | "medium" | "high";
    roomType?: string | undefined;
}, {
    url: string;
    analysisDate: string;
    propertyId: string;
    filename: string;
    aiScore: number;
    qualityScore: number;
    compositionScore: number;
    lightingScore: number;
    propertyConditionScore: number;
    insights: string[];
    suggestions: string[];
    tags: string[];
    marketability: "low" | "medium" | "high";
    roomType?: string | undefined;
}>;
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
//# sourceMappingURL=analysis.d.ts.map