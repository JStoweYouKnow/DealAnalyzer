import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { headers } from "next/headers";
import { logger } from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    logger.warn("Stripe webhook called without signature");
    return NextResponse.json(
      { error: "No signature" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error("Webhook signature verification failed", err instanceof Error ? err : new Error(String(err)));
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const planId = session.metadata?.planId;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && planId && customerId && subscriptionId) {
          // Retrieve full subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          
          // Store subscription in Convex database
          if (process.env.NEXT_PUBLIC_CONVEX_URL) {
            try {
              const { ConvexHttpClient } = await import('convex/browser');
              const apiModule = await import('../../../convex/_generated/api');
              const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
              
              await convexClient.mutation(apiModule.api.subscriptions.upsert, {
                userId,
                stripeCustomerId: customerId,
                stripeSubscriptionId: subscriptionId,
                planId,
                status: subscription.status as any,
                currentPeriodStart: subscription.current_period_start * 1000, // Convert to milliseconds
                currentPeriodEnd: subscription.current_period_end * 1000,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
              });

              logger.info("Subscription stored in database", {
                userId: userId.substring(0, 20),
                planId,
                subscriptionId,
              });
            } catch (error) {
              logger.error("Failed to store subscription in database", error instanceof Error ? error : new Error(String(error)));
            }
          }

          logger.info("Checkout session completed", {
            userId: userId.substring(0, 20),
            planId,
            customerId,
            subscriptionId,
          });
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Update subscription in database
        if (process.env.NEXT_PUBLIC_CONVEX_URL) {
          try {
            const { ConvexHttpClient } = await import('convex/browser');
            const apiModule = await import('../../../convex/_generated/api');
            const convexClient = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
            
            // Get existing subscription to find userId
            const existing = await convexClient.query(apiModule.api.subscriptions.getBySubscriptionId, {
              subscriptionId: subscription.id,
            });

            if (existing) {
              await convexClient.mutation(apiModule.api.subscriptions.upsert, {
                userId: existing.userId,
                stripeCustomerId: subscription.customer as string,
                stripeSubscriptionId: subscription.id,
                planId: existing.planId, // Keep existing planId
                status: subscription.status as any,
                currentPeriodStart: subscription.current_period_start * 1000,
                currentPeriodEnd: subscription.current_period_end * 1000,
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                canceledAt: subscription.canceled_at ? subscription.canceled_at * 1000 : undefined,
              });

              logger.info(`Subscription ${event.type} in database`, {
                subscriptionId: subscription.id,
                status: subscription.status,
              });
            }
          } catch (error) {
            logger.error("Failed to update subscription in database", error instanceof Error ? error : new Error(String(error)));
          }
        }

        logger.info(`Subscription ${event.type}`, {
          subscriptionId: subscription.id,
          status: subscription.status,
        });
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.info("Invoice payment succeeded", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        logger.warn("Invoice payment failed", {
          invoiceId: invoice.id,
          customerId: invoice.customer,
        });
        // TODO: Notify user of failed payment
        break;
      }

      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error("Error processing webhook", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

