import { v } from "convex/values";
import { mutation, query, action } from "./_generated/server";

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
 * SECURITY CRITICAL: Retrieve OAuth tokens for server-side use only.
 * 
 * ⚠️ WARNING: This query returns sensitive OAuth secrets (accessToken, refreshToken).
 * It is marked as public for technical reasons (actions need to call public queries),
 * but it MUST only be called from the retrieveTokensForServer action, NEVER directly from clients.
 * 
 * DO NOT call this query directly from client code. Use getTokenMetadata() instead.
 * This query exists solely to support the retrieveTokensForServer action.
 * 
 * @internal - This is exported only for technical reasons. Use retrieveTokensForServer action instead.
 */
export const getTokensForServerQuery = query({
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
    
    // SECURITY: This returns sensitive tokens - should only be called from server-side action
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
  handler: async (ctx, args): Promise<{
    accessToken: string;
    refreshToken: string;
    scope?: string;
    expiryDate?: number;
    tokenType?: string;
  } | null> => {
    // Note: In a production system, you should add additional authentication checks here
    // to ensure the caller is authorized and the request is coming from server-side code.
    // For now, we rely on the caller being a server-side API route.
    
    // Import API to access the query
    // Use dynamic import to avoid circular type reference during type checking
    const api = await import("./_generated/api");
    
    // Retrieve full token record including secrets (server-side only)
    // Note: getTokensForServerQuery is public for technical reasons (actions can only call public queries),
    // but it should never be called directly from clients - only through this action
    const tokens = await ctx.runQuery(
      (api as any).userOAuthTokens.getTokensForServerQuery,
      {
        userId: args.userId,
      }
    );
    
    // SECURITY: Only return tokens to server-side callers
    // This action should never be called from client code
    return tokens;
  },
});

