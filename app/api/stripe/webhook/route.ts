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
          // In this version we don't persist subscription details to Convex.
          // Stripe still processes the payment and you can see subscriptions
          // in the Stripe Dashboard. A future version can add persistent
          // storage without relying on convex/_generated/api on Vercel.
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

