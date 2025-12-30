export declare const getWeeklyDigestData: import("convex/server").RegisteredQuery<"public", {
    weeksAgo?: number | undefined;
    userId: string;
}, Promise<{
    topDeals: {
        _id: import("convex/values").GenericId<"dealAnalyses">;
        address: string;
        price: number;
        cashFlow: number;
        cocReturn: number;
        capRate: number;
        meetsCriteria: boolean;
        analysisDate: number;
    }[];
    stats: {
        totalAnalyzed: number;
        dealsPassingCriteria: number;
        averageCashFlow: number;
        averageCoC: number;
        averageCapRate: number;
        passingRate: number;
    };
    dateRange: {
        from: number;
        to: number;
    };
}>>;
export declare const getUsersForDigest: import("convex/server").RegisteredQuery<"public", {}, Promise<{
    userId: string;
    email: string;
    userName: string;
    preferences: {
        weeklyDigest: boolean;
        timezone: string;
    };
}[]>>;
export declare const getMarketInsights: import("convex/server").RegisteredQuery<"public", {
    limit?: number | undefined;
}, Promise<{
    city: string;
    state: string;
    medianPrice: number;
    priceChange: number;
    trend: string;
    marketHeat: "hot" | "warm" | "balanced" | "cool";
}[]>>;
//# sourceMappingURL=weeklyDigest.d.ts.map