import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Upsert user OAuth tokens
export const upsertTokens = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    scope: v.optional(v.string()),
    expiryDate: v.optional(v.number()),
    tokenType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if tokens already exist for this user
    const existing = await ctx.db
      .query("userOAuthTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();

    const now = Date.now();

    if (existing) {
      // Update existing tokens
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        scope: args.scope,
        expiryDate: args.expiryDate,
        tokenType: args.tokenType,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new token record
      const tokenId = await ctx.db.insert("userOAuthTokens", {
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        scope: args.scope,
        expiryDate: args.expiryDate,
        tokenType: args.tokenType,
        updatedAt: now,
      });
      return tokenId;
    }
  },
});

