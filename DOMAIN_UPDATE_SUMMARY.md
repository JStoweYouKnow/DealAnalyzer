# Domain Update Summary

## New Domain
**https://comfortfinder.projcomfort.com**

## Code Changes Completed ✅

### 1. Mobile App Configuration
- **File**: `mobile/app.json`
  - Updated `associatedDomains` for iOS universal links
  - Changed from: `comfort-finder-analyzer.vercel.app`
  - Changed to: `comfortfinder.projcomfort.com`

### 2. Subscription Screen
- **File**: `mobile/src/screens/SubscriptionScreen.tsx`
  - Updated hardcoded `baseUrl` for Stripe checkout redirects
  - Changed from: `https://comfort-finder-analyzer.vercel.app`
  - Changed to: `https://comfortfinder.projcomfort.com`

### 3. Stripe Checkout Route
- **File**: `app/api/stripe/create-checkout-session/route.ts`
  - Updated fallback `baseUrl` for checkout session creation
  - Changed from: `https://comfort-finder-analyzer.vercel.app`
  - Changed to: `https://comfortfinder.projcomfort.com`

### 4. Terms & Privacy Pages
- **Files**: 
  - `app/terms/page.tsx`
  - `app/privacy/page.tsx`
  - Updated website URL references

## Vercel Environment Variables to Update 🔧

You need to update these environment variables in your Vercel project settings:

### Required Updates:
1. **NEXT_PUBLIC_APP_DOMAIN**
   - Current: `https://comfort-finder-analyzer.vercel.app`
   - Update to: `https://comfortfinder.projcomfort.com`

2. **GMAIL_REDIRECT_URI** (if set)
   - Current: `https://comfort-finder-analyzer.vercel.app/api/gmail-callback`
   - Update to: `https://comfortfinder.projcomfort.com/api/gmail-callback`

### Optional (if using):
3. **EXPO_PUBLIC_API_URL** (for mobile app builds)
   - Update to: `https://comfortfinder.projcomfort.com`

## Google Cloud Console Updates 🔐

### OAuth Redirect URIs
Update your Google OAuth client configuration to include the new domain:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** > **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add to **Authorized redirect URIs**:
   - `https://comfortfinder.projcomfort.com/api/gmail-callback`
5. Remove old redirect URI if no longer needed:
   - `https://comfort-finder-analyzer.vercel.app/api/gmail-callback`

## Stripe Webhook Configuration 💳

Update your Stripe webhook endpoint URL:

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Edit your webhook endpoint
3. Update the endpoint URL to:
   - `https://comfortfinder.projcomfort.com/api/stripe/webhook`

## Vercel Domain Configuration 🌐

1. Go to your Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain: `comfortfinder.projcomfort.com`
4. Configure DNS records as instructed by Vercel
5. Wait for DNS propagation (can take up to 48 hours)

## Mobile App Build Updates 📱

After updating the domain, you'll need to:

1. **Rebuild the mobile app** to pick up the new `associatedDomains` configuration
2. **Update EAS environment variables** (if using):
   ```bash
   eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://comfortfinder.projcomfort.com"
   ```

## Testing Checklist ✅

After making all updates:

- [ ] Verify website loads at `https://comfortfinder.projcomfort.com`
- [ ] Test Gmail OAuth flow (should redirect to new domain)
- [ ] Test Stripe checkout flow (should redirect correctly)
- [ ] Verify mobile app deep links work with new domain
- [ ] Check that all API endpoints are accessible
- [ ] Verify webhook endpoints are receiving events

## Notes 📝

- The code uses `NEXT_PUBLIC_APP_DOMAIN` environment variable as the primary source
- If not set, it falls back to detecting from request headers
- The hardcoded fallbacks in code are now updated to the new domain
- Gmail OAuth redirect URI is dynamically generated from the request, so it should work automatically once the domain is configured


