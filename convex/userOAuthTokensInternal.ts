import { v } from "convex/values";
import { internalQuery } from "./_generated/server";

/**
 * SECURITY CRITICAL: Retrieve OAuth tokens for internal Convex use only.
 * 
 * This internal query returns sensitive OAuth secrets (accessToken, refreshToken).
 * It is moved to this separate file to break circular dependencies with the generated API.
 * 
 * @internal
 */
export const getTokensForServerQuery = internalQuery({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    console.log('[Convex] getTokensForServerQuery called for userId:', userId);

    const tokens = await ctx.db
      .query("userOAuthTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!tokens) {
      return null;
    }

    // SECURITY: This returns sensitive tokens - only accessible from internal Convex functions
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      scope: tokens.scope,
      expiryDate: tokens.expiryDate,
      tokenType: tokens.tokenType,
    };
  },
});
