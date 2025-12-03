# Testing Production Authentication

This guide explains how to test authentication with production Clerk keys before submitting to the App Store.

## Strategy Overview

We use **different Clerk keys for different environments**:
- **Development** (`npm start`): Test key - fast initialization (~2s)
- **Production builds** (`eas build --profile production`): Production key - real users

## Testing Approaches

### 1. Development Mode (Current Setup - RECOMMENDED)

**Fastest for daily development:**

```bash
cd mobile
npm start
# or
npx expo start --clear
```

- Uses test Clerk key: `pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ`
- Fast initialization (~2 seconds)
- Test users only
- Perfect for developing features like Gmail OAuth

**To use production key in development:**
1. Edit `mobile/.env.local`
2. Uncomment the production key line
3. Restart Expo
4. Wait ~50 seconds for Clerk to initialize

### 2. Preview Build (BEST FOR TESTING PRODUCTION)

**Create a preview build with production keys:**

```bash
cd mobile

# iOS preview
eas build --profile preview --platform ios

# Android preview
eas build --profile preview --platform android
```

This creates an installable build that:
- ✅ Uses production Clerk key
- ✅ Can be installed on device via TestFlight or direct download
- ✅ Behaves exactly like production
- ✅ Easy to share with testers

### 3. Production Build (FINAL TESTING)

**Create the actual App Store build:**

```bash
cd mobile

# iOS production
eas build --profile production --platform ios

# Android production
eas build --profile production --platform android
```

### 4. Create Test Users in Production Clerk

**Option A: Via Clerk Dashboard**
1. Go to https://dashboard.clerk.com
2. Select your production instance
3. Navigate to **Users** → **Create User**
4. Add test email/password
5. Use in your app

**Option B: Via App Sign Up**
1. Build app with production key
2. Tap "Sign Up" in the app
3. Create account with your test email
4. Verify email if required

## Current Configuration

### Local Development (.env.local)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_bGFyZ2Utd29sZi01LmNsZXJrLmFjY291bnRzLmRldiQ
```

### Production Builds (eas.json)
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k
```

## Testing Gmail OAuth Flow

### In Development (Test Key)
1. Start dev server: `npm start`
2. Sign in with test account
3. Navigate to Email Settings
4. Tap "Connect Gmail"
5. Complete OAuth in browser
6. Verify redirect back to app works

### In Production Build
1. Create preview build: `eas build --profile preview --platform ios`
2. Install on device
3. Create/sign in with production account
4. Test Gmail OAuth flow
5. Verify everything works end-to-end

## Troubleshooting

### Clerk Takes 50+ Seconds to Load (Production Key)
This is a known issue with the production Clerk instance. Solutions:
- **For development**: Use test key (current setup)
- **For production testing**: Use EAS preview/production builds
- **For quick prod tests**: Create test user in Clerk dashboard, use those credentials

### "Account Not Found" Error
- You're using production key but account exists in test instance
- Solution: Create account in production Clerk instance or switch to test key

### Gmail OAuth Not Redirecting Back
- Ensure you're using `WebBrowser.openAuthSessionAsync()` (already configured)
- Check that callback route returns HTTP 302 redirect for mobile (already configured)
- Verify `dealanalyzer://` scheme is configured in app.json (already done)

## Recommended Workflow

**Daily Development:**
```bash
# Use test key for fast development
npm start
```

**Before Submitting to App Store:**
```bash
# Test with production build
eas build --profile preview --platform ios
# Install and test on device
# Fix any issues
# Create production build
eas build --profile production --platform ios
```

## Quick Reference

| Environment | Clerk Key | Init Time | Users |
|-------------|-----------|-----------|-------|
| Development | Test | ~2s | Test instance |
| Preview | Production | ~5s | Production instance |
| Production | Production | ~5s | Production instance |

---

**TL;DR**: Use test key for development (fast). Use preview builds to test production auth. Both approaches work and are valid.
