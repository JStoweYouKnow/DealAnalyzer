# 🚀 Production Build & TestFlight Submission Guide

## Step 1: Create Production Build

Run this command in your terminal (it will prompt for Apple credentials):

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile production --platform ios
```

**When prompted:**
1. **"Do you want to log in to your Apple account?"** → Type `yes` and press Enter
2. Enter your **Apple ID email** (associated with your Apple Developer account)
3. Enter your **Apple ID password** (or use App-Specific Password if 2FA is enabled)
4. If asked about **Team ID**, select your development team

**Build will take:** ~10-15 minutes

## Step 2: Wait for Build to Complete

You'll see:
- Build progress in the terminal
- A link to view build logs
- Build ID when complete

**Note the Build ID** - you'll need it for submission.

## Step 3: Submit to TestFlight

Once the build is complete, submit it to TestFlight:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

**Or submit a specific build:**

```bash
eas submit --platform ios --id [BUILD_ID]
```

**When prompted:**
- If credentials are already configured in `eas.json`, it will use those
- Otherwise, it will prompt for:
  - Apple ID
  - App Store Connect App ID
  - Team ID

## Alternative: One-Command Build & Submit

You can also build and submit in one go (after first build):

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile production --platform ios --auto-submit
```

This will automatically submit to TestFlight after the build completes.

## Update Submit Configuration (Optional)

Before submitting, you can update `eas.json` to avoid prompts:

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
- **appleId**: Your Apple ID email
- **ascAppId**: App Store Connect → Your App → App Information → Apple ID
- **appleTeamId**: Apple Developer → Membership → Team ID

## Current Production Configuration

✅ **Production profile is configured with:**
- Release build configuration
- Production Clerk key (`pk_live_...`)
- Production Convex URL
- Production API URL (`https://comfortfinder.projcomfort.com`)

## Troubleshooting

### Build Fails with Credential Errors
- Make sure you have an **Apple Developer account** ($99/year)
- Verify your Apple ID has access to the development team
- Try running `eas credentials` to manage credentials manually

### Submit Fails
- Make sure the build status is **"finished"** (not "in progress")
- Verify your App Store Connect app exists
- Check that your Apple ID has App Manager or Admin access

### "No builds found"
- Wait for the build to complete
- Check build status: `eas build:list --platform ios`

## Next Steps After TestFlight

1. **Wait for processing** - Apple processes builds (usually 10-30 minutes)
2. **Add to TestFlight** - Go to App Store Connect → TestFlight
3. **Add testers** - Internal or External testers
4. **Test the app** - Install via TestFlight app

## Quick Reference Commands

```bash
# Create production build
eas build --profile production --platform ios

# Check build status
eas build:list --platform ios --limit 5

# Submit latest build to TestFlight
eas submit --platform ios --latest

# Submit specific build
eas submit --platform ios --id [BUILD_ID]

# Build and auto-submit
eas build --profile production --platform ios --auto-submit
```

