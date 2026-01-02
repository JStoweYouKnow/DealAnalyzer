import { z } from "zod";
export declare const emailDealStatus: z.ZodEnum<["new", "reviewed", "analyzed", "archived"]>;
export declare const emailDealSchema: z.ZodObject<{
    id: z.ZodString;
    subject: z.ZodString;
    sender: z.ZodString;
    receivedDate: z.ZodDate;
    emailContent: z.ZodString;
    userId: z.ZodOptional<z.ZodString>;
    extractedProperty: z.ZodOptional<z.ZodObject<{
        address: z.ZodOptional<z.ZodString>;
        city: z.ZodOptional<z.ZodString>;
        state: z.ZodOptional<z.ZodString>;
        price: z.ZodOptional<z.ZodNumber>;
        monthlyRent: z.ZodOptional<z.ZodNumber>;
        bedrooms: z.ZodOptional<z.ZodNumber>;
        bathrooms: z.ZodOptional<z.ZodNumber>;
        sqft: z.ZodOptional<z.ZodNumber>;
        adr: z.ZodOptional<z.ZodNumber>;
        occupancyRate: z.ZodOptional<z.ZodNumber>;
        imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            type: z.ZodEnum<["listing", "company", "external", "other"]>;
            description: z.ZodOptional<z.ZodString>;
            aiScore: z.ZodOptional<z.ZodNumber>;
            aiCategory: z.ZodOptional<z.ZodEnum<["excellent", "good", "fair", "poor"]>>;
            aiReasoning: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }, {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }>, "many">>;
        imageScores: z.ZodOptional<z.ZodArray<z.ZodObject<{
            url: z.ZodString;
            aiScore: z.ZodOptional<z.ZodNumber>;
            aiCategory: z.ZodOptional<z.ZodEnum<["excellent", "good", "fair", "poor"]>>;
            aiReasoning: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }, {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
    }, {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
    }>>;
    status: z.ZodEnum<["new", "reviewed", "analyzed", "archived"]>;
    analysis: z.ZodOptional<z.ZodObject<{
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
    contentHash: z.ZodOptional<z.ZodString>;
    createdAt: z.ZodDate;
    updatedAt: z.ZodDate;
}, "strip", z.ZodTypeAny, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "new" | "reviewed" | "analyzed" | "archived";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: Date;
    userId?: string | undefined;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
    } | undefined;
    analysis?: {
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
    contentHash?: string | undefined;
}, {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    status: "new" | "reviewed" | "analyzed" | "archived";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: Date;
    userId?: string | undefined;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            url: string;
            type: "listing" | "company" | "external" | "other";
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            url: string;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
        }[] | undefined;
    } | undefined;
    analysis?: {
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
    contentHash?: string | undefined;
}>;
export declare const emailMonitoringResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        subject: z.ZodString;
        sender: z.ZodString;
        receivedDate: z.ZodDate;
        emailContent: z.ZodString;
        userId: z.ZodOptional<z.ZodString>;
        extractedProperty: z.ZodOptional<z.ZodObject<{
            address: z.ZodOptional<z.ZodString>;
            city: z.ZodOptional<z.ZodString>;
            state: z.ZodOptional<z.ZodString>;
            price: z.ZodOptional<z.ZodNumber>;
            monthlyRent: z.ZodOptional<z.ZodNumber>;
            bedrooms: z.ZodOptional<z.ZodNumber>;
            bathrooms: z.ZodOptional<z.ZodNumber>;
            sqft: z.ZodOptional<z.ZodNumber>;
            adr: z.ZodOptional<z.ZodNumber>;
            occupancyRate: z.ZodOptional<z.ZodNumber>;
            imageUrls: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
            sourceLinks: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                type: z.ZodEnum<["listing", "company", "external", "other"]>;
                description: z.ZodOptional<z.ZodString>;
                aiScore: z.ZodOptional<z.ZodNumber>;
                aiCategory: z.ZodOptional<z.ZodEnum<["excellent", "good", "fair", "poor"]>>;
                aiReasoning: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }, {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }>, "many">>;
            imageScores: z.ZodOptional<z.ZodArray<z.ZodObject<{
                url: z.ZodString;
                aiScore: z.ZodOptional<z.ZodNumber>;
                aiCategory: z.ZodOptional<z.ZodEnum<["excellent", "good", "fair", "poor"]>>;
                aiReasoning: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }, {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }>, "many">>;
        }, "strip", z.ZodTypeAny, {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        }, {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        }>>;
        status: z.ZodEnum<["new", "reviewed", "analyzed", "archived"]>;
        analysis: z.ZodOptional<z.ZodObject<{
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
        contentHash: z.ZodOptional<z.ZodString>;
        createdAt: z.ZodDate;
        updatedAt: z.ZodDate;
    }, "strip", z.ZodTypeAny, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: "new" | "reviewed" | "analyzed" | "archived";
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: Date;
        userId?: string | undefined;
        extractedProperty?: {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        } | undefined;
        analysis?: {
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
        contentHash?: string | undefined;
    }, {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: "new" | "reviewed" | "analyzed" | "archived";
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: Date;
        userId?: string | undefined;
        extractedProperty?: {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        } | undefined;
        analysis?: {
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
        contentHash?: string | undefined;
    }>, "many">>;
    error: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    success: boolean;
    data?: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: "new" | "reviewed" | "analyzed" | "archived";
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: Date;
        userId?: string | undefined;
        extractedProperty?: {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        } | undefined;
        analysis?: {
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
        contentHash?: string | undefined;
    }[] | undefined;
    error?: string | undefined;
}, {
    success: boolean;
    data?: {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: "new" | "reviewed" | "analyzed" | "archived";
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: Date;
        userId?: string | undefined;
        extractedProperty?: {
            address?: string | undefined;
            city?: string | undefined;
            state?: string | undefined;
            monthlyRent?: number | undefined;
            bedrooms?: number | undefined;
            bathrooms?: number | undefined;
            imageUrls?: string[] | undefined;
            sourceLinks?: {
                url: string;
                type: "listing" | "company" | "external" | "other";
                description?: string | undefined;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
            adr?: number | undefined;
            occupancyRate?: number | undefined;
            price?: number | undefined;
            sqft?: number | undefined;
            imageScores?: {
                url: string;
                aiScore?: number | undefined;
                aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
                aiReasoning?: string | undefined;
            }[] | undefined;
        } | undefined;
        analysis?: {
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
        contentHash?: string | undefined;
    }[] | undefined;
    error?: string | undefined;
}>;
export type EmailDeal = z.infer<typeof emailDealSchema>;
export type EmailMonitoringResponse = z.infer<typeof emailMonitoringResponseSchema>;
//# sourceMappingURL=email.d.ts.map