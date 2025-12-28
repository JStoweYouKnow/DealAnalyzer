# 📤 Submit to TestFlight - Interactive Mode

## Issue
EAS wasn't prompting for Apple credentials because `eas.json` had placeholder values.

## Solution Applied
I've temporarily removed the placeholder values from `eas.json` so EAS will prompt you interactively.

## Run This Command

**In your terminal** (not through Cursor), run:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

**Or to select a specific build:**

```bash
eas submit --platform ios
```

## What to Expect

When you run the command, it will prompt you for:

1. **Select a build** (if not using `--latest`)
   - Choose your production build

2. **Apple ID**
   - Enter your Apple ID email (e.g., `your-email@example.com`)

3. **App Store Connect App ID**
   - This is a number (e.g., `1234567890`)
   - Find it in: App Store Connect → Your App → App Information → **Apple ID**

4. **Apple Team ID**
   - This is 10 characters (e.g., `AB32CZE81F`)
   - Find it in: [Apple Developer](https://developer.apple.com) → Account → Membership → **Team ID**

5. **Password** (if needed)
   - Your Apple ID password
   - Or App-Specific Password if 2FA is enabled

## After Successful Submission

Once submitted, you can:
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to **TestFlight** → **iOS Builds**
3. Wait for processing (usually 10-30 minutes)
4. Add testers and distribute

## Optional: Save Credentials

After successful submission, if you want to save credentials for future use, I can add them back to `eas.json` with your actual values.

