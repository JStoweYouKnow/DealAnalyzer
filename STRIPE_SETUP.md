# Stripe Integration Setup Guide

This guide will help you set up Stripe for subscription monetization in the DealAnalyzer app.

## Prerequisites

1. A Stripe account (sign up at [stripe.com](https://stripe.com))
2. Access to your Stripe Dashboard

## Step 1: Create Stripe Products and Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
2. Create three products with the following pricing:

### Basic Plan
- **Name**: Basic
- **Price**: $9.99/month
- **Billing**: Recurring monthly
- **Price ID**: Copy this after creation (starts with `price_`)

### Pro Plan
- **Name**: Pro
- **Price**: $29.99/month
- **Billing**: Recurring monthly
- **Price ID**: Copy this after creation (starts with `price_`)

### Enterprise Plan
- **Name**: Enterprise
- **Price**: $99.99/month
- **Billing**: Recurring monthly
- **Price ID**: Copy this after creation (starts with `price_`)

## Step 2: Get Stripe API Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → API keys
2. Copy your **Publishable key** (starts with `pk_`)
3. Copy your **Secret key** (starts with `sk_`)

## Step 3: Set Up Webhook Endpoint

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your endpoint URL:
   - **Production**: `https://comfort-finder-analyzer.vercel.app/api/stripe/webhook`
   - **Development**: Use Stripe CLI (see below)
4. Select events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Webhook signing secret** (starts with `whsec_`)

## Step 4: Configure Environment Variables

Add the following to your `.env.local` file (for local development) and Vercel environment variables (for production):

```bash
# Stripe Configuration (replace placeholders with your real values)
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Stripe Price IDs (from Step 1)
STRIPE_PRICE_ID_BASIC=price_basic_plan_id
STRIPE_PRICE_ID_PRO=price_pro_plan_id
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_plan_id

# App Domain (for redirect URLs)
NEXT_PUBLIC_APP_DOMAIN=https://comfort-finder-analyzer.vercel.app
```

## Step 5: Update Convex Schema

The Convex schema has been updated to include a `subscriptions` table. Make sure to:

1. Run `npx convex dev` to sync the schema
2. Or run `npx convex deploy` if deploying to production

## Step 6: Test the Integration

### Local Development with Stripe CLI

1. Install Stripe CLI: `brew install stripe/stripe-cli/stripe` (macOS) or see [Stripe CLI docs](https://stripe.com/docs/stripe-cli)
2. Login: `stripe login`
3. Forward webhooks to local server:
   ```bash
   stripe listen --forward-to localhost:3002/api/stripe/webhook
   ```
4. Copy the webhook signing secret from the CLI output and use it as `STRIPE_WEBHOOK_SECRET` in your `.env.local`

### Testing Subscriptions

1. Use Stripe test cards:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and any CVC
2. Test the subscription flow in the mobile app
3. Check Stripe Dashboard → Customers to verify subscription creation
4. Check Convex Dashboard to verify subscription data is stored

## Step 7: Protect Premium Features

Use the subscription utilities to protect premium features:

```typescript
import { useSubscriptionStatus, hasActiveSubscription } from '../utils/subscription';

function MyComponent() {
  const { data: subscription } = useSubscriptionStatus();
  
  if (!hasActiveSubscription(subscription)) {
    return <UpgradePrompt />;
  }
  
  return <PremiumFeature />;
}
```

## Features by Plan

### Basic ($9.99/month)
- Up to 10 property analyses per month
- Email deal monitoring
- Basic market intelligence
- Standard support

### Pro ($29.99/month)
- Unlimited property analyses
- Email deal monitoring
- Advanced market intelligence
- Neighborhood trends
- Property comparison
- Priority support

### Enterprise ($99.99/month)
- Everything in Pro
- API access
- Custom integrations
- Dedicated account manager
- SLA guarantee

## Troubleshooting

### Webhook Not Receiving Events
- Verify webhook URL is correct
- Check webhook signing secret matches
- Ensure webhook endpoint is publicly accessible
- Check Stripe Dashboard → Webhooks → Recent events for errors

### Subscription Not Showing in App
- Verify Convex schema is synced
- Check webhook is processing events correctly
- Verify user ID is being passed correctly in checkout session
- Check Convex Dashboard for subscription records

### Payment Fails
- Verify Stripe API keys are correct
- Check card details are valid
- Review Stripe Dashboard → Payments for error details
- Ensure webhook is processing payment events

## Production Checklist

- [ ] Create production Stripe account (not test mode)
- [ ] Create production products and prices
- [ ] Set up production webhook endpoint
- [ ] Add all environment variables to Vercel
- [ ] Test subscription flow end-to-end
- [ ] Set up monitoring for webhook failures
- [ ] Configure email notifications for failed payments
- [ ] Set up subscription cancellation flow

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Stripe Support](https://support.stripe.com)

