# 📱 App Store Connect Setup Required

## Issue
EAS is trying to verify your app exists in App Store Connect, which is causing authentication issues.

## Solution: Add App Store Connect App ID

You need to add your **App Store Connect App ID** to `eas.json` to skip the app verification step.

### Step 1: Find Your App Store Connect App ID

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps**
3. Find your app (or create it if it doesn't exist)
4. Click on the app
5. Go to **App Information**
6. Find the **Apple ID** (this is a number like `1234567890`)
7. Copy this number - this is your `ascAppId`

### Step 2: Create App if It Doesn't Exist

If your app doesn't exist in App Store Connect:

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **My Apps** → **+** button
3. Select **New App**
4. Fill in:
   - **Platform**: iOS
   - **Name**: "The Comfort Finder"
   - **Primary Language**: English (or your preference)
   - **Bundle ID**: `com.comfortfinder.dealanalyzer`
   - **SKU**: `comfort-finder-ios` (or any unique identifier)
5. Click **Create**
6. Copy the **Apple ID** from the App Information page

### Step 3: Update eas.json

Once you have the `ascAppId`, I can update `eas.json` with it. The format will be:

```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyId": "3V85XXH32R",
      "ascApiKeyIssuerId": "adb920a3-6abd-4ddd-a30e-58e8ac2d28a5",
      "ascApiKeyPath": "./asc-api-key.p8",
      "ascAppId": "1234567890"
    }
  }
}
```

Replace `1234567890` with your actual App Store Connect App ID.

## Why This Helps

By providing `ascAppId`, EAS will:
- Skip the app verification step
- Use the API key directly for submission
- Avoid the Apple Developer Portal authentication that's failing

## Alternative: Use Apple ID Credentials

If you prefer to use Apple ID credentials instead of API key:

1. Remove the API key configuration from `eas.json`
2. Run `eas submit` interactively
3. It will prompt for Apple ID and password

But the API key method is more reliable once configured correctly.

