var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
        frequency: v.optional(v.union(v.literal("immediate"), v.literal("daily"), v.literal("weekly"))),
        email: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        var _a, _b, _c, _d, _e, _f;
        const existing = await ctx.db
            .query("emailPreferences")
            .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
            .first();
        const { userId } = args, updates = __rest(args, ["userId"]);
        if (existing) {
            await ctx.db.patch(existing._id, updates);
            return await ctx.db.get(existing._id);
        }
        else {
            const newPreferences = {
                userId,
                notifyOnNewDeals: (_a = updates.notifyOnNewDeals) !== null && _a !== void 0 ? _a : false,
                notifyOnAnalysisComplete: (_b = updates.notifyOnAnalysisComplete) !== null && _b !== void 0 ? _b : false,
                notifyOnCriteriaMatch: (_c = updates.notifyOnCriteriaMatch) !== null && _c !== void 0 ? _c : true,
                notifyOnWeeklySummary: (_d = updates.notifyOnWeeklySummary) !== null && _d !== void 0 ? _d : false,
                frequency: (_e = updates.frequency) !== null && _e !== void 0 ? _e : "immediate",
                email: (_f = updates.email) !== null && _f !== void 0 ? _f : "",
            };
            const id = await ctx.db.insert("emailPreferences", newPreferences);
            return await ctx.db.get(id);
        }
    },
});
