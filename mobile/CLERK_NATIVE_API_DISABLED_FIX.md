# Clerk "Native API Disabled" Error Fix

## Error Message

"verification failed, native api disabled"

## Root Cause

This error occurs when Clerk's Native API is disabled in the Clerk Dashboard for your production instance. This is a security feature that needs to be explicitly enabled.

## Solution

### Step 1: Enable Native API in Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your **production** application (the one with the `pk_live_...` key)
3. Navigate to **Settings** → **API Keys**
4. Look for **"Native API"** or **"Mobile SDK"** settings
5. Enable **"Native API"** or **"Mobile SDK Support"**
6. Save the changes

### Step 2: Verify Configuration

The error might also occur if:
- Using production key in Expo Go (some features may be limited)
- Native API not enabled for your Clerk instance
- Domain restrictions blocking native API access

### Step 3: Alternative - Use Test Key for Development

If you're developing and testing, you can use the test key which typically has native API enabled by default:

```bash
# In .env.local
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ
```

Then restart Expo:
```bash
npx expo start --clear
```

### Step 4: Check ClerkProvider Configuration

Ensure `ClerkProvider` is properly configured in `App.tsx`:

```typescript
<ClerkProvider
  publishableKey={trimmedKey}
  tokenCache={tokenCache}
>
  {/* Your app */}
</ClerkProvider>
```

## Common Causes

1. **Native API Disabled**: Most common - needs to be enabled in Clerk Dashboard
2. **Production Key Restrictions**: Production keys may have stricter security settings
3. **Domain Mismatch**: Clerk instance domain doesn't match your app configuration
4. **Expo Go Limitations**: Some Clerk features may not work in Expo Go

## Verification Steps

1. **Check Clerk Dashboard**:
   - Settings → API Keys
   - Look for "Native API" or "Mobile SDK" toggle
   - Ensure it's enabled

2. **Check Key Type**:
   - Production key: `pk_live_...` (may need native API enabled)
   - Test key: `pk_test_...` (usually enabled by default)

3. **Test with Test Key**:
   - Temporarily switch to test key
   - If it works, the issue is with production key configuration

## Quick Fix

For immediate testing, use the test key (already in `.env.local`):

```bash
# .env.local
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ
```

Then enable native API in Clerk Dashboard for production key, and switch back when ready.

## Additional Notes

- Native API must be enabled for email verification to work
- This is a security feature to prevent unauthorized API access
- Once enabled, it may take a few minutes to propagate

