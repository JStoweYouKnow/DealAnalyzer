import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { fetchMutation } from "convex/nextjs";
import { logger } from "@/lib/logger";

// Helper function to decode base64url with padding
function decodeBase64(base64: string): string {
  // Convert from base64url to base64
  let padded = base64.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding if needed
  while (padded.length % 4) {
    padded += '=';
  }
  return Buffer.from(padded, 'base64').toString('utf-8');
}

// Helper to get userId from bearer token (for mobile apps)
async function getUserIdFromBearerToken(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        // Decode the JWT to extract the user ID (same approach as middleware)
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode the payload (second part of JWT) with proper base64 padding
          const payload = JSON.parse(decodeBase64(parts[1]));
          if (payload?.sub) {
            // Verify it's a Clerk token by checking the issuer
            if (payload.iss?.includes('clerk') || payload.iss?.includes('clerk.accounts')) {
              console.log('[Bearer Auth] ✅ Authenticated via bearer token', {
                userId: payload.sub.substring(0, 20),
                issuer: payload.iss,
              });
              return payload.sub;
            } else {
              console.log('[Bearer Auth] ⚠️ Token issuer is not Clerk', {
                issuer: payload.iss,
              });
            }
          }
        }
      } catch (error) {
        console.error('[Bearer Auth] Token decode failed:', error);
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
    const apiModule = await import('../../../../../convex/_generated/api');
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
