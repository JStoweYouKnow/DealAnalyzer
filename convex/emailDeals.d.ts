export declare const create: import("convex/server").RegisteredMutation<"public", {
    status?: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested" | undefined;
    extractedProperty?: any;
    contentHash?: string | undefined;
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
}, Promise<import("convex/values").GenericId<"emailDeals">>>;
export declare const list: import("convex/server").RegisteredQuery<"public", {
    status?: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested" | undefined;
    includeArchived?: boolean | undefined;
    limit?: number | undefined;
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
}[]>>;
export declare const getByGmailId: import("convex/server").RegisteredQuery<"public", {
    userId?: string | undefined;
    gmailId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
} | null>>;
export declare const getById: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"emailDeals">;
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
} | null>>;
export declare const update: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"emailDeals">;
    updates: {
        status?: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested" | undefined;
        emailContent?: string | undefined;
        subject?: string | undefined;
        sender?: string | undefined;
        extractedProperty?: any;
        analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    };
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
} | null>>;
export declare const updateStatus: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"emailDeals">;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
} | null>>;
export declare const remove: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"emailDeals">;
}, Promise<{
    success: boolean;
}>>;
export declare const findByContentHash: import("convex/server").RegisteredQuery<"public", {
    contentHash: string;
}, Promise<{
    _id: import("convex/values").GenericId<"emailDeals">;
    _creationTime: number;
    extractedProperty?: {
        address?: string | undefined;
        city?: string | undefined;
        state?: string | undefined;
        monthlyRent?: number | undefined;
        bedrooms?: number | undefined;
        bathrooms?: number | undefined;
        imageUrls?: string[] | undefined;
        sourceLinks?: {
            description?: string | undefined;
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
            type: "listing" | "company" | "external" | "other";
        }[] | undefined;
        adr?: number | undefined;
        occupancyRate?: number | undefined;
        price?: number | undefined;
        sqft?: number | undefined;
        imageScores?: {
            aiScore?: number | undefined;
            aiCategory?: "excellent" | "good" | "fair" | "poor" | undefined;
            aiReasoning?: string | undefined;
            url: string;
        }[] | undefined;
    } | undefined;
    contentHash?: string | undefined;
    analysisId?: import("convex/values").GenericId<"dealAnalyses"> | undefined;
    status: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested";
    emailContent: string;
    subject: string;
    sender: string;
    receivedDate: number;
    userId: string;
    gmailId: string;
} | null>>;
export declare const bulkCreate: import("convex/server").RegisteredMutation<"public", {
    userId: string;
    deals: {
        status?: "new" | "reviewed" | "analyzed" | "archived" | "pending" | "interested" | "not_interested" | undefined;
        extractedProperty?: any;
        contentHash?: string | undefined;
        emailContent: string;
        subject: string;
        sender: string;
        receivedDate: number;
        gmailId: string;
    }[];
}, Promise<{
    gmailId: string;
    id: import("convex/values").GenericId<"emailDeals">;
    created: boolean;
}[]>>;
//# sourceMappingURL=emailDeals.d.ts.map