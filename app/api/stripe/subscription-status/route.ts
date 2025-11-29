import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logger } from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

// Helper function to get user ID from request
async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try Clerk cookie-based auth first (for web)
  try {
    const { auth } = await import("@clerk/nextjs/server");
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
        const parts = token.split('.');
        if (parts.length === 3) {
          // Decode base64 with padding
          let padded = parts[1];
          while (padded.length % 4) {
            padded += '=';
          }
          const payload = JSON.parse(Buffer.from(padded, 'base64').toString());
          if (payload?.sub && (payload.iss?.includes('clerk') || payload.iss?.includes('clerk.accounts'))) {
            return payload.sub;
          }
        }
      } catch (error) {
        logger.warn("Failed to decode bearer token for subscription status", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Retrieve subscription from Convex database
    if (process.env.NEXT_PUBLIC_CONVEX_URL) {
      try {
        const { ConvexHttpClient } = await import('convex/browser');
        const apiModule = await import('../../../convex/_generated/api');
        const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
        
        const subscription = await convexClient.query(apiModule.api.subscriptions.getByUserId, {
          userId,
        });

        if (subscription && subscription.status === 'active') {
          return NextResponse.json({
            hasSubscription: true,
            plan: subscription.planId,
            status: subscription.status,
            currentPeriodEnd: subscription.currentPeriodEnd,
          });
        }
      } catch (error) {
        logger.error("Error retrieving subscription from database", error instanceof Error ? error : new Error(String(error)));
      }
    }

    // No active subscription found
    return NextResponse.json({
      hasSubscription: false,
      plan: null,
      status: null,
    });
  } catch (error) {
    logger.error("Error checking subscription status", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Failed to check subscription status" },
      { status: 500 }
    );
  }
}

