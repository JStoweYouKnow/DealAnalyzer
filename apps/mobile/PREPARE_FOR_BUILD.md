# 🚀 Quick Build Preparation Checklist

## ✅ Current Status

- ✅ EAS CLI installed and logged in as: `pjcdev`
- ✅ `eas.json` configured (fixed invalid bundleIdentifier field)
- ✅ Android build type set to `app-bundle` (for Play Store)
- ⚠️ EAS Project ID needs to be set in `app.json`

## 🔧 Step 1: Configure EAS Project

Run this command to link your project to EAS:

```bash
cd mobile
eas build:configure
```

When prompted:
- **Would you like to automatically create an EAS project?** → **Yes**
- This will update `app.json` with your actual EAS project ID

## 🔧 Step 2: Verify Configuration

After running `eas build:configure`, verify:

1. **Check `app.json`** - The `extra.eas.projectId` should be updated (not "YOUR_EAS_PROJECT_ID_HERE")
2. **Check `eas.json`** - Should be valid (we just fixed it)

## 🔧 Step 3: Set Production Environment Variables

Before building for production, you need to update `eas.json` with production values:

### Option A: Update `eas.json` directly (for now)

Edit `mobile/eas.json` and replace in the `production` section:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_ACTUAL_PRODUCTION_KEY",
    "EXPO_PUBLIC_CONVEX_URL": "https://your-prod-deployment.convex.cloud",
    "EXPO_PUBLIC_API_URL": "https://comfort-finder-analyzer.vercel.app"
  }
}
```

### Option B: Use EAS Secrets (Recommended for production)

```bash
# Set secrets via EAS CLI (more secure)
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_..."
eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value "https://your-prod.convex.cloud"
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://comfort-finder-analyzer.vercel.app"
```

Then remove the `env` section from `production` in `eas.json` - EAS will automatically inject secrets.

## 🧪 Step 4: Test Build (Development Profile)

Before production, test with development profile:

```bash
# Build for iOS simulator (fastest test)
eas build --platform ios --profile development

# Or build for Android
eas build --platform android --profile development
```

## 🏗️ Step 5: Production Build

Once development builds work:

```bash
# iOS for App Store
eas build --platform ios --profile production

# Android for Play Store
eas build --platform android --profile production
```

## 📝 Notes

- **Development builds** use test keys (already configured)
- **Production builds** need production keys (update `eas.json` or use secrets)
- First build takes 10-20 minutes
- You'll get a download link when done

## ⚠️ Important Reminders

1. **Never commit production keys** to git
2. **Use EAS Secrets** for production (more secure)
3. **Test development builds first** before production
4. **Bundle ID** is already set correctly: `com.comfortfinder.dealanalyzer`

## 🎯 Next Steps After Build

1. Test the build on a real device
2. Verify all features work
3. Check that production API keys are being used
4. Proceed with App Store submission (see `SETUP_FOR_APP_STORE.md`)


