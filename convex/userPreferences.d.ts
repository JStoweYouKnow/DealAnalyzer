export declare const getPreferences: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"emailPreferences">;
    _creationTime: number;
    userId: string;
    notifyOnNewDeals: boolean;
    notifyOnAnalysisComplete: boolean;
    notifyOnCriteriaMatch: boolean;
    notifyOnWeeklySummary: boolean;
    frequency: "immediate" | "daily" | "weekly";
    email: string;
} | null>>;
export declare const updatePreferences: import("convex/server").RegisteredMutation<"public", {
    notifyOnNewDeals?: boolean | undefined;
    notifyOnAnalysisComplete?: boolean | undefined;
    notifyOnCriteriaMatch?: boolean | undefined;
    notifyOnWeeklySummary?: boolean | undefined;
    frequency?: "immediate" | "daily" | "weekly" | undefined;
    email?: string | undefined;
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"emailPreferences">;
    _creationTime: number;
    userId: string;
    notifyOnNewDeals: boolean;
    notifyOnAnalysisComplete: boolean;
    notifyOnCriteriaMatch: boolean;
    notifyOnWeeklySummary: boolean;
    frequency: "immediate" | "daily" | "weekly";
    email: string;
} | null>>;
//# sourceMappingURL=userPreferences.d.ts.map