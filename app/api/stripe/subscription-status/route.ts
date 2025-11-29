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

    // NOTE: For now, we don't persist subscriptions in Convex on the server.
    // The mobile app can still use Stripe Checkout for payments, but this
    // endpoint will report no active subscription until a full persistence
    // layer is implemented without relying on convex/_generated/api on Vercel.
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

