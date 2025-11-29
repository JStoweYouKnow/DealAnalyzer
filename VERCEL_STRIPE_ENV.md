# Vercel Environment Variables for Stripe

Add these environment variables to your Vercel project for production:

## Steps to Add to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project: `comfort-finder-analyzer`
3. Go to **Settings** → **Environment Variables**
4. Add each variable below:

## Required Environment Variables

```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
```

```
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

```
STRIPE_PRICE_ID_BASIC=price_basic_plan_id
```

```
STRIPE_PRICE_ID_PRO=price_pro_plan_id
```

```
STRIPE_PRICE_ID_ENTERPRISE=price_enterprise_plan_id
```

```
NEXT_PUBLIC_APP_DOMAIN=https://comfort-finder-analyzer.vercel.app
```

## Important Notes

- **Environment**: Select "Production" (and optionally "Preview" and "Development" if you want them in all environments)
- **After adding**: Redeploy your application for changes to take effect
- **Webhook URL**: Make sure your Stripe webhook is configured to point to:
  `https://comfort-finder-analyzer.vercel.app/api/stripe/webhook`

## Verify Webhook Configuration

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → Developers → Webhooks
2. Verify the endpoint URL matches: `https://comfort-finder-analyzer.vercel.app/api/stripe/webhook`
3. Ensure these events are selected:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. The webhook signing secret should match: `whsec_GMGJX7KXMZATBZaf5WZT88yIDq6Bdeyb`

## Testing

After adding the environment variables and redeploying:

1. Test subscription checkout in the mobile app
2. Check Stripe Dashboard → Customers to verify subscription creation
3. Check Stripe Dashboard → Webhooks → Recent events to verify webhook delivery
4. Verify subscription appears in the app after successful payment

