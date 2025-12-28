# 📱 Installing Preview Build on Physical Device

## Issue
The previous build was created for iOS Simulator only (`simulator: true`), which cannot be installed on physical devices.

## Solution: Create a Device Build

### Step 1: Build for Physical Device

Run this command in your terminal (it will prompt for Apple credentials):

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile preview --platform ios
```

**When prompted:**
1. **"Do you want to log in to your Apple account?"** → Type `yes` and press Enter
2. Enter your **Apple ID email** (the one associated with your Apple Developer account)
3. Enter your **Apple ID password** (or use App-Specific Password if 2FA is enabled)
4. If asked about **Team ID**, select your development team

### Step 2: Wait for Build to Complete

The build will take approximately 10-15 minutes. You'll see:
- Build progress in the terminal
- A link to view build logs
- A QR code when complete

### Step 3: Install on Your Device

Once the build completes:

1. **Scan the QR code** shown in the terminal with your iPhone camera
2. Or **open the build URL** on your device:
   ```
   https://expo.dev/accounts/pjcdev/projects/deal-analyzer-mobile/builds/[BUILD_ID]
   ```
3. Tap **"Install"** when prompted
4. If you see "Untrusted Developer":
   - Go to **Settings** → **General** → **VPN & Device Management**
   - Tap your developer certificate
   - Tap **"Trust [Your Name]"**

## Alternative: Use Development Build (Easier for Testing)

If you don't have Apple Developer credentials set up yet, you can use a development build:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile development --platform ios
```

Development builds:
- ✅ Don't require App Store Connect setup
- ✅ Can be installed via TestFlight or direct install
- ✅ Include development tools for debugging
- ⚠️ Require Expo Go or development client

## Troubleshooting

### "Untrusted Developer" Error
1. Go to **Settings** → **General** → **VPN & Device Management**
2. Find your developer certificate
3. Tap **"Trust"**

### "Unable to Install" Error
- Make sure you're using the **device build** (not simulator)
- Check that your device UDID is registered in your Apple Developer account
- Try downloading the `.ipa` file directly and installing via Finder (Mac) or 3uTools (Windows)

### Build Fails with Credential Errors
- Make sure you have an **Apple Developer account** ($99/year)
- Verify your Apple ID has access to the development team
- Try running `eas credentials` to manage credentials manually

## Current Build Status

The last successful build was:
- **Build ID**: `de1de5c9-6300-4dd2-a54c-bcc1df174fc1`
- **Type**: Simulator build (cannot install on device)
- **Status**: Finished ✅

You need to create a **new build** with `simulator: false` for device installation.

