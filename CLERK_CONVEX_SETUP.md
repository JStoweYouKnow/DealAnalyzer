# Clerk + Convex Integration Setup Guide

## Step 1: Set AUTH_SECRET in Convex Dashboard

1. Go to the Convex dashboard: https://dashboard.convex.dev/d/strong-condor-993/settings/environment-variables
2. Click "Add Environment Variable"
3. Set the variable name to: `AUTH_SECRET`
4. Set the value to: `e66bfa1517a120798f4d286655028e3c11122dea4971aea516b4ff90ade2e519`
5. Click "Save"

## Step 2: Deploy Convex Functions

After setting the AUTH_SECRET, run:
```bash
cd /Users/v/Downloads/DealAnalyzer
CONVEX_DEPLOYMENT=strong-condor-993 npx convex deploy
npx convex codegen
```

## Step 3: Configure Clerk Integration

The following environment variables are already set in your `.env` file:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `AUTH_SECRET`

## Step 4: Test the Integration

1. Restart your Next.js server:
```bash
npm run dev:next
```

2. Visit http://localhost:3002 and test the sign-in functionality

## Current Status

✅ Clerk packages installed
✅ Environment variables configured
✅ Navigation updated with auth components
✅ Middleware configured for protected routes
⏳ Waiting for AUTH_SECRET to be set in Convex dashboard
⏳ Convex schema deployment pending
⏳ Auth functions need to be re-enabled

## Next Steps After AUTH_SECRET Setup

1. Re-enable auth imports in `convex/emailDeals.ts`
2. Re-enable auth tables in `convex/schema.ts`
3. Update Convex storage to use real user authentication
4. Test the full authentication flow

## Files Modified

- `middleware.ts` - Added Clerk middleware
- `app/layout.tsx` - Added ClerkProvider
- `app/components/navigation.tsx` - Added sign-in/sign-out components
- `convex/auth.config.ts` - Convex auth configuration
- `convex/schema.ts` - Added userId fields and auth tables
- `convex/emailDeals.ts` - Updated functions for user-specific data
- `.env` - Added Clerk and auth environment variables
