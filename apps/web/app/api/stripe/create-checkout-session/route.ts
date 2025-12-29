import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { logger } from "@/lib/logger";

// Use the default API version from the installed Stripe library to avoid
// hard-coding a specific date that can drift from the type definition.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

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
        logger.warn("Failed to decode bearer token for Stripe checkout", {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  return null;
}

// Subscription plans configuration
const PLANS = {
  basic: {
    name: "Basic",
    priceId: process.env.STRIPE_PRICE_ID_BASIC || "",
    amount: 9.99,
    features: [
      "Up to 10 property analyses per month",
      "Email deal monitoring",
      "Basic market intelligence",
      "Standard support",
    ],
  },
  pro: {
    name: "Pro",
    priceId: process.env.STRIPE_PRICE_ID_PRO || "",
    amount: 29.99,
    features: [
      "Unlimited property analyses",
      "Email deal monitoring",
      "Advanced market intelligence",
      "Neighborhood trends",
      "Property comparison",
      "Priority support",
    ],
  },
  enterprise: {
    name: "Enterprise",
    priceId: process.env.STRIPE_PRICE_ID_ENTERPRISE || "",
    amount: 99.99,
    features: [
      "Everything in Pro",
      "API access",
      "Custom integrations",
      "Dedicated account manager",
      "SLA guarantee",
    ],
  },
};

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { planId, successUrl, cancelUrl } = body;

    if (!planId || !PLANS[planId as keyof typeof PLANS]) {
      return NextResponse.json(
        { error: "Invalid plan ID" },
        { status: 400 }
      );
    }

    const plan = PLANS[planId as keyof typeof PLANS];
    const baseUrl = process.env.NEXT_PUBLIC_APP_DOMAIN || 
                   request.headers.get("origin") || 
                   "https://comfortfinder.projcomfort.com";

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: body.email, // Optional: pre-fill email
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${baseUrl}/subscription/cancel`,
      client_reference_id: userId,
      metadata: {
        userId,
        planId,
      },
    });

    logger.info("Created Stripe checkout session", {
      userId: userId.substring(0, 20),
      planId,
      sessionId: session.id,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error("Error creating Stripe checkout session", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve plans
export async function GET() {
  return NextResponse.json({
    plans: Object.entries(PLANS).map(([id, plan]) => ({
      id,
      name: plan.name,
      amount: plan.amount,
      features: plan.features,
    })),
  });
}

