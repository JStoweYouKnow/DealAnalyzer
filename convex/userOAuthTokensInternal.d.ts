/**
 * SECURITY CRITICAL: Retrieve OAuth tokens for internal Convex use only.
 *
 * This internal query returns sensitive OAuth secrets (accessToken, refreshToken).
 * It is moved to this separate file to break circular dependencies with the generated API.
 *
 * @internal
 */
export declare const getTokensForServerQuery: import("convex/server").RegisteredQuery<"internal", {
    userId: string;
}, Promise<{
    accessToken: string;
    refreshToken: string;
    scope: string | undefined;
    expiryDate: number | undefined;
    tokenType: string | undefined;
} | null>>;
//# sourceMappingURL=userOAuthTokensInternal.d.ts.map