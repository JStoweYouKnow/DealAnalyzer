import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { logger } from "@/lib/logger";

// Helper to get userId from bearer token (for mobile apps)
async function getUserIdFromBearerToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        const { verifyToken } = await import("@clerk/backend");
        const decoded = await verifyToken(token, {
          jwtKey: process.env.CLERK_SECRET_KEY!,
        });
        return decoded.sub || null;
      } catch (error) {
        console.error('[Bearer Auth] Token verification failed:', error);
        return null;
      }
    }
  }
  return null;
}

/**
 * Disconnect Gmail account
 * This endpoint deletes the OAuth tokens for the user's Gmail account
 */
export async function POST(request: NextRequest) {
  try {
    // Get userId from Clerk auth (cookie-based for web) or bearer token (for mobile)
    const { userId: clerkUserId } = await auth();
    let userId = clerkUserId;

    // If no cookie-based userId, try bearer token (mobile apps)
    if (!userId) {
      userId = await getUserIdFromBearerToken(request);
    }

    if (!userId) {
      logger.warn("Unauthorized: No userId from Clerk auth or bearer token");
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    logger.info("Gmail disconnect triggered", { userId: userId.substring(0, 20) });

    // Delete the OAuth tokens from Convex
    const apiModule = await import('../../../convex/_generated/api');
    const result = await fetchMutation(apiModule.api.userOAuthTokens.deleteTokens, {
      userId,
    });

    logger.info("Gmail disconnect completed", {
      userId: userId.substring(0, 20),
      deleted: result.deleted,
    });

    return NextResponse.json({
      success: true,
      message: result.deleted
        ? "Gmail account disconnected successfully"
        : "Gmail account was not connected",
      deleted: result.deleted,
    });
  } catch (error: any) {
    logger.error("Error disconnecting Gmail", error instanceof Error ? error : undefined, {
      errorMessage: error.message || 'Unknown error',
    });

    return NextResponse.json(
      { error: `Failed to disconnect Gmail: ${error.message}` },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'gmail-disconnect',
    message: 'Gmail disconnect endpoint is active. Use POST to disconnect.',
  });
}
