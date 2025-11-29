import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create or update subscription
export const upsert = mutation({
  args: {
    userId: v.string(),
    stripeCustomerId: v.string(),
    stripeSubscriptionId: v.string(),
    planId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("canceled"),
      v.literal("past_due"),
      v.literal("trialing"),
      v.literal("incomplete"),
      v.literal("incomplete_expired"),
      v.literal("unpaid")
    ),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.optional(v.boolean()),
    canceledAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Check if subscription already exists
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) => 
        q.eq("stripeSubscriptionId", args.stripeSubscriptionId)
      )
      .first();

    const now = Date.now();
    const subscriptionData = {
      userId: args.userId,
      stripeCustomerId: args.stripeCustomerId,
      stripeSubscriptionId: args.stripeSubscriptionId,
      planId: args.planId,
      status: args.status,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd ?? false,
      canceledAt: args.canceledAt,
      updatedAt: now,
    };

    if (existing) {
      // Update existing subscription
      await ctx.db.patch(existing._id, subscriptionData);
      return existing._id;
    } else {
      // Create new subscription
      return await ctx.db.insert("subscriptions", {
        ...subscriptionData,
        createdAt: now,
      });
    }
  },
});

// Get subscription by user ID
export const getByUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return subscription;
  },
});

// Get subscription by Stripe customer ID
export const getByCustomerId = query({
  args: { customerId: v.string() },
  handler: async (ctx, args) => {
    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_customer_id", (q) => 
        q.eq("stripeCustomerId", args.customerId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    return subscription;
  },
});

// Get subscription by Stripe subscription ID
export const getBySubscriptionId = query({
  args: { subscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_stripe_subscription_id", (q) => 
        q.eq("stripeSubscriptionId", args.subscriptionId)
      )
      .first();
  },
});

