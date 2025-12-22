import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { storage } from "../../../server/storage";
import { logger } from "@/lib/logger";

async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try Clerk cookie-based auth first (for web)
  try {
    const { userId } = await auth();
    if (userId) {
      return userId;
    }
  } catch (error) {
    // Clerk auth not available, continue to bearer token check
  }

  // Try bearer token auth (for mobile apps)
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token) {
      try {
        // Clerk JWT tokens have the user ID in the 'sub' claim
        // Decode the JWT to extract the user ID
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode the payload (second part of JWT) - use base64url decoding
          let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          while (base64.length % 4) {
            base64 += '=';
          }
          const payload = JSON.parse(Buffer.from(base64, 'base64').toString());
          logger.info("Decoded JWT payload", {
            hasSub: !!payload?.sub,
            issuer: payload?.iss,
            userId: payload?.sub?.substring(0, 20),
          });
          
          if (payload?.sub) {
            // Verify it's a Clerk token by checking the issuer
            if (payload.iss?.includes('clerk') || payload.iss?.includes('clerk.accounts')) {
              logger.info("✅ Authenticated via Clerk bearer token", {
                userId: payload.sub.substring(0, 20),
              });
              return payload.sub;
            } else {
              logger.warn("⚠️ Token issuer is not Clerk", {
                issuer: payload.iss,
              });
            }
          } else {
            logger.warn("⚠️ Token payload missing 'sub' claim", {
              payloadKeys: Object.keys(payload || {}),
            });
          }
        } else {
          logger.warn("⚠️ Invalid JWT format - expected 3 parts", {
            actualParts: parts.length,
          });
        }
      } catch (error) {
        logger.warn("❌ Failed to decode bearer token", {
          error: error instanceof Error ? error.message : String(error),
          tokenPreview: token.substring(0, 20) + '...',
        });
      }
    } else {
      logger.warn("⚠️ Bearer token is empty");
    }
  } else {
    logger.info("ℹ️ No Authorization header or not Bearer token", {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader?.substring(0, 20),
    });
  }

  // Development fallback: check x-user-session-id header
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    const headerUserId = request.headers.get('x-user-session-id');
    if (headerUserId && headerUserId !== 'temp-ssr-id') {
      logger.info("Development fallback: using x-user-session-id from request headers", {
        userId: headerUserId.substring(0, 20),
      });
      return headerUserId;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    logger.info("Getting email deals from storage");

    // Check if Convex is configured
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
      logger.warn("NEXT_PUBLIC_CONVEX_URL not configured. Returning empty email deals array.");
      return NextResponse.json([]);
    }

    // Get userId from request (supports both cookie-based and bearer token auth)
    const userId = await getUserIdFromRequest(request);
    
    if (!userId || userId === 'temp-ssr-id') {
      const isDev = process.env.NODE_ENV === 'development';
      if (!isDev) {
        logger.warn("Unauthorized: Missing Clerk userId in production");
      } else {
        logger.warn("Unauthorized in development: No valid Clerk userId and no valid x-user-session-id header");
      }
      return NextResponse.json(
        { error: "Unauthorized. Please sign in." },
        { status: 401 }
      );
    }

    const requestLogger = logger.withContext({ userId: userId.substring(0, 20) });
    requestLogger.info("Fetching email deals for user");
    const emailDeals = await storage.getEmailDeals(userId);
    requestLogger.info(`Retrieved ${emailDeals.length} email deals for user`, {
      count: emailDeals.length,
    });
    return NextResponse.json(emailDeals);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    logger.error("Error getting email deals", error instanceof Error ? error : undefined, {
      errorMessage,
    });

    // Check if the error is related to Convex initialization
    if (errorMessage.includes('CONVEX') || errorMessage.includes('Convex')) {
      logger.warn("Convex storage not available. Returning empty array. Make sure NEXT_PUBLIC_CONVEX_URL is set and Convex is deployed.");
      return NextResponse.json([]);
    }

    // For other errors, return 500 with details
    return NextResponse.json(
      { error: `Failed to get email deals: ${errorMessage}` },
      { status: 500 }
    );
  }
}

