# 📤 Submit to TestFlight

## ⚠️ Important: Preview vs Production Builds

**TestFlight requires a PRODUCTION build**, not a preview build.

Your most recent build (`c8bb3458-9d10-406c-ae11-021f135703ca`) is a **preview** build, which cannot be submitted to TestFlight.

## Option 1: Submit Preview Build (Not Recommended)

If you want to try submitting the preview build anyway (may fail):

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

## Option 2: Create Production Build First (Recommended)

### Step 1: Create Production Build

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile production --platform ios
```

This will:
- Create a production-ready build
- Use Release configuration
- Include all production environment variables
- Take ~10-15 minutes

### Step 2: Update Submit Configuration

Before submitting, update `eas.json` with your actual Apple credentials:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-email@example.com",
      "ascAppId": "1234567890",
      "appleTeamId": "ABCD123456"
    }
  }
}
```

**Where to find these:**
- **appleId**: Your Apple ID email (used for App Store Connect)
- **ascAppId**: App Store Connect App ID (found in App Store Connect → Your App → App Information)
- **appleTeamId**: Your Apple Developer Team ID (found in Apple Developer account settings)

### Step 3: Submit to TestFlight

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

Or submit a specific build:

```bash
eas submit --platform ios --id c8bb3458-9d10-406c-ae11-021f135703ca
```

## Quick Command (If Submit Config is Set)

If you've already configured the submit settings in `eas.json`:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

## Troubleshooting

### "No builds found"
- Make sure you have a **production** build (not preview)
- Check build status: `eas build:list --platform ios`

### "Invalid credentials"
- Update `eas.json` submit configuration with correct Apple credentials
- Or run `eas submit` interactively to enter credentials

### "Build not found"
- Use `eas build:list` to find the correct build ID
- Submit with: `eas submit --platform ios --id [BUILD_ID]`

## Current Build Status

- **Latest Build**: `c8bb3458-9d10-406c-ae11-021f135703ca`
- **Type**: Preview (internal distribution)
- **Status**: Finished ✅
- **Can submit to TestFlight?**: ❌ No (needs production build)

