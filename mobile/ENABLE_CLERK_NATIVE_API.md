# Enable Clerk Native API - Step by Step

## Error

"verification failed, native api disabled"

## Solution: Enable Native API in Clerk Dashboard

### Step 1: Access Clerk Dashboard

1. Go to [https://dashboard.clerk.com](https://dashboard.clerk.com)
2. Sign in to your account
3. Select your **production** application:
   - Look for the app with key: `pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k`
   - Or search for "comfortfinder" or "project-comfort-dev"

### Step 2: Navigate to Settings

1. In your Clerk application dashboard, click **"Settings"** in the left sidebar
2. Look for **"API Keys"** or **"Configuration"** section

### Step 3: Enable Native API

1. Find the **"Native API"** or **"Mobile SDK"** section
2. Look for a toggle or checkbox labeled:
   - "Enable Native API"
   - "Mobile SDK Support"
   - "Native Mobile Support"
3. **Enable** this option
4. **Save** the changes

### Step 4: Alternative Location

If you don't see it in Settings → API Keys, try:

1. **Settings** → **General**
2. Look for **"Mobile SDK"** or **"Native API"** section
3. Enable the toggle

Or:

1. **Settings** → **Security**
2. Look for **"Native API"** or **"Mobile App Support"**
3. Enable if available

### Step 5: Verify

After enabling:

1. Wait 1-2 minutes for changes to propagate
2. Restart your Expo app
3. Try signing up again
4. The error should be resolved

## If Native API Option is Not Available

Some Clerk instances may not have this option visible. In that case:

### Option 1: Contact Clerk Support

1. Go to [Clerk Support](https://clerk.com/support)
2. Request to enable Native API for your production instance
3. Provide your instance ID or publishable key

### Option 2: Use Test Key for Development

For development/testing, use the test key which typically has Native API enabled:

```bash
# In .env.local (already configured)
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ
```

Then restart Expo:
```bash
cd mobile
npx expo start --clear
```

### Option 3: Check Clerk Documentation

1. Visit [Clerk Docs - Native API](https://clerk.com/docs)
2. Search for "Native API" or "Mobile SDK"
3. Follow the latest setup instructions

## Verification

After enabling Native API, you should be able to:
- ✅ Sign up with email verification
- ✅ Receive verification codes
- ✅ Complete the sign-up flow

## Current Configuration

- **Production Key**: `pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k`
- **Test Key** (for dev): `pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ`

## Quick Test

To verify if Native API is the issue:

1. Switch to test key temporarily
2. If it works → Native API needs to be enabled for production key
3. If it doesn't work → There may be another issue

