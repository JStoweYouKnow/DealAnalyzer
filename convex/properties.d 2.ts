export declare const createAnalysis: import("convex/server").RegisteredMutation<"public", {
    aiAnalysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        riskLevel: "low" | "medium" | "high";
        recommendedAction: "buy" | "pass" | "investigate";
        confidence: number;
    } | undefined;
    monthlyExpenses: number;
    property: {
        id?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        address: string;
        purchasePrice: number;
    };
    totalCashNeeded: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
    monthlyIncome: number;
    criteria: {
        strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
}, Promise<import("convex/values").GenericId<"dealAnalyses">>>;
export declare const listAnalyses: import("convex/server").RegisteredQuery<"public", {
    meetsCriteria?: boolean | undefined;
    limit?: number | undefined;
}, Promise<{
    _id: import("convex/values").GenericId<"dealAnalyses">;
    _creationTime: number;
    aiAnalysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        riskLevel: "low" | "medium" | "high";
        recommendedAction: "buy" | "pass" | "investigate";
        confidence: number;
    } | undefined;
    monthlyExpenses: number;
    analysisDate: number;
    property: {
        id?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        address: string;
        purchasePrice: number;
    };
    totalCashNeeded: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
    userId: string;
    monthlyIncome: number;
    criteria: {
        strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
}[]>>;
export declare const getAnalysis: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"dealAnalyses">;
}, Promise<{
    _id: import("convex/values").GenericId<"dealAnalyses">;
    _creationTime: number;
    aiAnalysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        riskLevel: "low" | "medium" | "high";
        recommendedAction: "buy" | "pass" | "investigate";
        confidence: number;
    } | undefined;
    monthlyExpenses: number;
    analysisDate: number;
    property: {
        id?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        address: string;
        purchasePrice: number;
    };
    totalCashNeeded: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
    userId: string;
    monthlyIncome: number;
    criteria: {
        strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
} | null>>;
export declare const updateAnalysis: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"dealAnalyses">;
    updates: {
        monthlyExpenses?: number | undefined;
        property?: any;
        totalCashNeeded?: number | undefined;
        cashFlow?: number | undefined;
        cocReturn?: number | undefined;
        capRate?: number | undefined;
        meetsCriteria?: boolean | undefined;
        aiAnalysis?: any;
        monthlyIncome?: number | undefined;
        criteria?: any;
    };
}, Promise<{
    _id: import("convex/values").GenericId<"dealAnalyses">;
    _creationTime: number;
    aiAnalysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        riskLevel: "low" | "medium" | "high";
        recommendedAction: "buy" | "pass" | "investigate";
        confidence: number;
    } | undefined;
    monthlyExpenses: number;
    analysisDate: number;
    property: {
        id?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        address: string;
        purchasePrice: number;
    };
    totalCashNeeded: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
    userId: string;
    monthlyIncome: number;
    criteria: {
        strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
} | null>>;
export declare const deleteAnalysis: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"dealAnalyses">;
}, Promise<{
    success: boolean;
}>>;
export declare const createPhotoAnalysis: import("convex/server").RegisteredMutation<"public", {
    aiScore?: number | undefined;
    aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
    aiReasoning?: string | undefined;
    features?: string[] | undefined;
    issues?: string[] | undefined;
    propertyId: string;
    photoUrl: string;
}, Promise<import("convex/values").GenericId<"photoAnalyses">>>;
export declare const getPhotoAnalyses: import("convex/server").RegisteredQuery<"public", {
    propertyId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"photoAnalyses">;
    _creationTime: number;
    aiScore?: number | undefined;
    aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
    aiReasoning?: string | undefined;
    features?: string[] | undefined;
    issues?: string[] | undefined;
    analysisDate: number;
    propertyId: string;
    photoUrl: string;
}[]>>;
export declare const updatePhotoAnalysis: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"photoAnalyses">;
    updates: {
        aiScore?: number | undefined;
        aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
        aiReasoning?: string | undefined;
        features?: string[] | undefined;
        issues?: string[] | undefined;
    };
}, Promise<{
    _id: import("convex/values").GenericId<"photoAnalyses">;
    _creationTime: number;
    aiScore?: number | undefined;
    aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
    aiReasoning?: string | undefined;
    features?: string[] | undefined;
    issues?: string[] | undefined;
    analysisDate: number;
    propertyId: string;
    photoUrl: string;
} | null>>;
export declare const createComparison: import("convex/server").RegisteredMutation<"public", {
    name: string;
    propertyIds: import("convex/values").GenericId<"dealAnalyses">[];
}, Promise<import("convex/values").GenericId<"propertyComparisons">>>;
export declare const getComparisons: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
}, Promise<{
    _id: import("convex/values").GenericId<"propertyComparisons">;
    _creationTime: number;
    createdAt: number;
    name: string;
    propertyIds: import("convex/values").GenericId<"dealAnalyses">[];
}[]>>;
export declare const searchByAddress: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
    address: string;
}, Promise<{
    _id: import("convex/values").GenericId<"dealAnalyses">;
    _creationTime: number;
    aiAnalysis?: {
        summary: string;
        pros: string[];
        cons: string[];
        riskLevel: "low" | "medium" | "high";
        recommendedAction: "buy" | "pass" | "investigate";
        confidence: number;
    } | undefined;
    monthlyExpenses: number;
    analysisDate: number;
    property: {
        id?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        zipCode?: string | undefined;
        propertyType?: "single-family" | "condo" | "townhouse" | "duplex" | "multi-family" | "commercial" | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        squareFootage?: number | undefined;
        yearBuilt?: number | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        address: string;
        purchasePrice: number;
    };
    totalCashNeeded: number;
    cashFlow: number;
    cocReturn: number;
    capRate: number;
    meetsCriteria: boolean;
    userId: string;
    monthlyIncome: number;
    criteria: {
        strategy: "conservative" | "aggressive" | "brrrr" | "moderate";
        targetCoCReturn: number;
        targetCapRate: number;
        maxLoanToValue: number;
        vacancyRate: number;
        maintenanceRate: number;
        managementRate: number;
        expectedAppreciation: number;
    };
}[]>>;
//# sourceMappingURL=properties.d.ts.map