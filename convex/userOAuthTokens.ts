import { v } from "convex/values";
import { mutation, query, action, internalQuery } from "./_generated/server";

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
    const userId = args.userId.trim();
    console.log('[Convex] upsertTokens called for userId:', userId);
    
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

/**
 * SECURITY: Get non-sensitive OAuth token metadata only.
 * This query is safe to expose to clients as it does NOT return accessToken or refreshToken.
 * Use this for checking connection status without exposing secrets.
 */
export const getTokenMetadata = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const tokens = await ctx.db
      .query("userOAuthTokens")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!tokens) {
      return null;
    }
    
    // SECURITY: Only return non-sensitive metadata - NEVER return accessToken or refreshToken
    return {
      scope: tokens.scope,
      expiryDate: tokens.expiryDate,
      tokenType: tokens.tokenType,
      updatedAt: tokens.updatedAt,
      // Explicitly exclude accessToken and refreshToken
    };
  },
});

/**
 * SECURITY CRITICAL: Retrieve OAuth tokens for internal Convex use only.
 *
 * ⚠️ WARNING: This internal query returns sensitive OAuth secrets (accessToken, refreshToken).
 * It can ONLY be called from other Convex functions (mutations/actions), NEVER from clients.
 *
 * DO NOT call this query directly. Use retrieveTokensForServer action from API routes instead.
 *
 * @internal - This is an internal query that can only be called from within Convex functions.
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

/**
 * SECURITY CRITICAL: Retrieve OAuth tokens for server-side use only.
 * 
 * ⚠️ WARNING: This action returns sensitive OAuth secrets (accessToken, refreshToken).
 * It MUST only be called from server-side API routes, NEVER from client-side code.
 * 
 * Tokens must remain server-side to prevent security breaches. Client code should
 * use getTokenMetadata() instead to check connection status without exposing secrets.
 * 
 * This action is intended for use in:
 * - Next.js API routes in the app/api directory
 * - Server-side functions only
 * 
 * DO NOT call this from:
 * - React components
 * - Client-side hooks
 * - Browser JavaScript
 * - Any client-facing code
 */
export const retrieveTokensForServer = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = args.userId.trim();
    console.log('[Convex] retrieveTokensForServer action called for userId:', userId);

    try {
      console.log('[Convex] Importing internal API from ./_generated/api...');
      const apiModule = await import("./_generated/api");
      const internal = apiModule.internal;
      
      if (!internal) {
        console.error('[Convex] internal object is missing from apiModule');
        throw new Error("Internal API not found");
      }

      console.log('[Convex] internal object found. Checking for getTokensForServerQuery...');
      if (!internal.userOAuthTokens || !internal.userOAuthTokens.getTokensForServerQuery) {
        console.error('[Convex] getTokensForServerQuery is missing from internal.userOAuthTokens');
        throw new Error("Internal query not found");
      }

      console.log('[Convex] calling ctx.runQuery with internal.userOAuthTokens.getTokensForServerQuery...');
      // Retrieve full token record including secrets (server-side only)
      // getTokensForServerQuery is an internal query that can only be called from within Convex
      const tokens = await ctx.runQuery(
        internal.userOAuthTokens.getTokensForServerQuery,
        {
          userId: userId,
        }
      );

      console.log('[Convex] getTokensForServerQuery result found:', !!tokens);

      // SECURITY: Only return tokens to server-side callers
      // This action should never be called from client code
      return tokens;
    } catch (error) {
      console.error('[Convex] Error in retrieveTokensForServer action:', error);
      throw error;
    }
  },
});

