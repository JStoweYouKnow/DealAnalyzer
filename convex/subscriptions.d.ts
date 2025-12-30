export declare const upsert: import("convex/server").RegisteredMutation<"public", {
    cancelAtPeriodEnd?: boolean | undefined;
    canceledAt?: number | undefined;
    status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
}, Promise<import("convex/values").GenericId<"subscriptions">>>;
export declare const getByUserId: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"subscriptions">;
    _creationTime: number;
    cancelAtPeriodEnd?: boolean | undefined;
    canceledAt?: number | undefined;
    createdAt: number;
    updatedAt: number;
    status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
} | null>>;
export declare const getByCustomerId: import("convex/server").RegisteredQuery<"public", {
    customerId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"subscriptions">;
    _creationTime: number;
    cancelAtPeriodEnd?: boolean | undefined;
    canceledAt?: number | undefined;
    createdAt: number;
    updatedAt: number;
    status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
} | null>>;
export declare const getBySubscriptionId: import("convex/server").RegisteredQuery<"public", {
    subscriptionId: string;
}, Promise<{
    _id: import("convex/values").GenericId<"subscriptions">;
    _creationTime: number;
    cancelAtPeriodEnd?: boolean | undefined;
    canceledAt?: number | undefined;
    createdAt: number;
    updatedAt: number;
    status: "active" | "canceled" | "past_due" | "trialing" | "incomplete" | "incomplete_expired" | "unpaid";
    userId: string;
    stripeCustomerId: string;
    stripeSubscriptionId: string;
    planId: string;
    currentPeriodStart: number;
    currentPeriodEnd: number;
} | null>>;
//# sourceMappingURL=subscriptions.d.ts.map