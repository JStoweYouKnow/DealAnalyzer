export declare const upsertTokens: import("convex/server").RegisteredMutation<"public", {
    scope?: string | undefined;
    expiryDate?: number | undefined;
    tokenType?: string | undefined;
    userId: string;
    accessToken: string;
    refreshToken: string;
}, Promise<import("convex/values").GenericId<"userOAuthTokens">>>;
/**
 * SECURITY: Get non-sensitive OAuth token metadata only.
 * This query is safe to expose to clients as it does NOT return accessToken or refreshToken.
 * Use this for checking connection status without exposing secrets.
 */
export declare const getTokenMetadata: import("convex/server").RegisteredQuery<"public", {
    userId: string;
}, Promise<{
    scope: string | undefined;
    expiryDate: number | undefined;
    tokenType: string | undefined;
    updatedAt: number;
} | null>>;
export declare const deleteTokens: import("convex/server").RegisteredMutation<"public", {
    userId: string;
}, Promise<{
    success: boolean;
    deleted: boolean;
}>>;
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
export declare const retrieveTokensForServer: import("convex/server").RegisteredAction<"public", {
    userId: string;
}, Promise<{
    accessToken: string;
    refreshToken: string;
    scope?: string;
    expiryDate?: number;
    tokenType?: string;
} | null>>;
//# sourceMappingURL=userOAuthTokens.d.ts.map