# 🔧 Fix: "No script URL provided" Error

## Problem
The app shows: **"No script URL provided. Make sure the packager is running or you have embedded a JS bundle in your application bundle."**

This happens when a preview build doesn't include an embedded JavaScript bundle.

## Root Cause
The preview build was created with `"buildConfiguration": "Debug"`, which may not properly embed the JS bundle for standalone installation.

## Solution

### Option 1: Rebuild with Release Configuration (Recommended)

I've updated `eas.json` to use `"buildConfiguration": "Release"` for preview builds, which ensures the JS bundle is properly embedded.

**Create a new build:**

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile preview --platform ios
```

When prompted:
1. Log in to your Apple account
2. Provide your Apple Developer credentials
3. Wait for build to complete (~10-15 minutes)

### Option 2: Use Development Build (If you need debugging)

If you need debugging capabilities, use the development profile:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile development --platform ios
```

**Then start Metro bundler:**
```bash
npx expo start --dev-client
```

The development build will connect to Metro for hot reloading.

### Option 3: Check Current Build Type

If you're using the existing build (`de1de5c9-6300-4dd2-a54c-bcc1df174fc1`), it was built for **simulator only** and won't work on physical devices anyway.

## What Changed

✅ Updated `eas.json` preview profile:
- Changed `"buildConfiguration": "Debug"` → `"Release"`
- This ensures the JS bundle is properly embedded in the app

## Verification

After installing the new build:
1. The app should launch without the "No script URL" error
2. No Metro bundler connection needed
3. App works offline (bundle is embedded)

## Troubleshooting

### Still seeing the error?
1. **Make sure you installed the NEW build** (not the old simulator build)
2. **Check build logs** to verify bundle was embedded:
   ```
   https://expo.dev/accounts/pjcdev/projects/deal-analyzer-mobile/builds/[BUILD_ID]
   ```
3. **Try clearing app data** and reinstalling

### Build fails?
- Make sure you have Apple Developer account credentials
- Verify your Apple ID has access to the development team
- Check that certificates are properly configured

