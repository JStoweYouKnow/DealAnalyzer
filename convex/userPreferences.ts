import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getPreferences = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("emailPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
  },
});

export const updatePreferences = mutation({
  args: {
    userId: v.string(),
    notifyOnNewDeals: v.optional(v.boolean()),
    notifyOnAnalysisComplete: v.optional(v.boolean()),
    notifyOnCriteriaMatch: v.optional(v.boolean()),
    notifyOnWeeklySummary: v.optional(v.boolean()),
    frequency: v.optional(
      v.union(
        v.literal("immediate"),
        v.literal("daily"),
        v.literal("weekly")
      )
    ),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("emailPreferences")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const { userId, ...updates } = args;

    if (existing) {
      await ctx.db.patch(existing._id, updates);
      return await ctx.db.get(existing._id);
    } else {
      const newPreferences = {
        userId,
        notifyOnNewDeals: updates.notifyOnNewDeals ?? false,
        notifyOnAnalysisComplete: updates.notifyOnAnalysisComplete ?? false,
        notifyOnCriteriaMatch: updates.notifyOnCriteriaMatch ?? true,
        notifyOnWeeklySummary: updates.notifyOnWeeklySummary ?? false,
        frequency: updates.frequency ?? "immediate" as const,
        email: updates.email ?? "",
      };
      const id = await ctx.db.insert("emailPreferences", newPreferences);
      return await ctx.db.get(id);
    }
  },
});

