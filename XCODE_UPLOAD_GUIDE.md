# Xcode Upload Guide - The Comfort Finder

## Prerequisites Checklist

Before uploading to Xcode/App Store, ensure you have:

- [ ] Apple Developer Account (enrolled in Apple Developer Program - $99/year)
- [ ] Valid signing certificates
- [ ] Provisioning profiles configured
- [ ] App Store Connect record created
- [ ] ASC API Key file (`asc-api-key.p8`) in the mobile directory

## Current App Configuration

- **App Name**: The Comfort Finder
- **Bundle ID**: `com.comfortfinder.dealanalyzer`
- **Version**: 1.0.0
- **Build Number**: 1
- **App Store Connect ID**: 6756039028
- **EAS Project ID**: 256e912e-3a30-479d-8524-c2c92a08f80a

---

## Option 1: Upload via EAS (Recommended - Easiest)

This is the easiest method as EAS handles all the building and uploading automatically.

### Step 1: Install EAS CLI (if not already installed)

```bash
cd mobile
npm install -g eas-cli
```

### Step 2: Login to EAS

```bash
eas login
```

### Step 3: Build for Production

```bash
eas build --platform ios --profile production
```

This will:
- Build your app in the cloud
- Sign it with your certificates
- Create an `.ipa` file

### Step 4: Submit to App Store

Once the build completes, submit it directly:

```bash
eas submit --platform ios --profile production
```

This uses your ASC API credentials configured in `eas.json` to upload automatically.

---

## Option 2: Build Locally with Xcode

Use this if you want more control or need to test locally first.

### Step 1: Open Project in Xcode

```bash
cd mobile/ios
open TheComfortFinder.xcworkspace
```

⚠️ **Important**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file (because you're using CocoaPods)

### Step 2: Configure Signing & Capabilities

1. In Xcode, select the **TheComfortFinder** project in the navigator
2. Select the **TheComfortFinder** target
3. Go to **Signing & Capabilities** tab
4. Check **Automatically manage signing**
5. Select your **Team** (your Apple Developer account)
6. Verify the **Bundle Identifier** is: `com.comfortfinder.dealanalyzer`

### Step 3: Select Build Destination

1. At the top of Xcode, click the device dropdown
2. Select **Any iOS Device (arm64)** or a connected device
3. Do NOT select a simulator

### Step 4: Archive the App

1. Go to menu: **Product** → **Archive**
2. Wait for the archive process to complete (5-15 minutes)
3. The **Organizer** window will open automatically

### Step 5: Validate the Archive

1. In the Organizer, select your archive
2. Click **Validate App**
3. Choose your distribution certificate
4. Click **Validate**
5. Wait for validation to complete

### Step 6: Distribute to App Store

1. Click **Distribute App**
2. Select **App Store Connect**
3. Click **Upload**
4. Choose your distribution certificate and provisioning profile
5. Click **Upload**
6. Wait for upload to complete

---

## Option 3: Export IPA and Upload via Transporter

### Step 1: Build and Export IPA from Xcode

1. Follow Steps 1-4 from Option 2
2. After archiving, click **Distribute App**
3. Select **App Store Connect**
4. Select **Export** (instead of Upload)
5. Choose a save location
6. This creates a `.ipa` file

### Step 2: Upload with Transporter App

1. Open **Transporter** app (from Mac App Store)
2. Sign in with your Apple ID
3. Drag and drop your `.ipa` file
4. Click **Deliver**

---

## Common Issues and Solutions

### Issue: "No accounts with App Store Connect access"

**Solution**: 
- Make sure you're enrolled in the Apple Developer Program ($99/year)
- Add your Apple ID in Xcode → Preferences → Accounts

### Issue: "Provisioning profile doesn't include signing certificate"

**Solution**:
```bash
# Revoke and regenerate certificates
cd mobile
eas credentials
# Select iOS → Production → Manage credentials
```

### Issue: "The Swift file header is malformed"

**Solution**: This is already fixed! The header file we just corrected should resolve this.

### Issue: Build fails with CocoaPods errors

**Solution**:
```bash
cd mobile/ios
pod deintegrate
pod install --repo-update
```

### Issue: "Missing compliance for encryption"

**Solution**: Already configured! Your `Info.plist` has:
```xml
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

---

## Pre-Submission Checklist

Before submitting to App Store, verify:

- [ ] **App Icons**: All required sizes present in `Images.xcassets/AppIcon.appiconset/`
- [ ] **Screenshots**: Prepare screenshots for all required device sizes
- [ ] **App Description**: Written and ready for App Store Connect
- [ ] **Privacy Policy URL**: Available and accessible
- [ ] **Support URL**: Working contact/support page
- [ ] **Age Rating**: Determined and set in App Store Connect
- [ ] **App Category**: Selected (likely Business or Productivity)
- [ ] **Keywords**: Optimized for App Store search
- [ ] **Version Number**: Semantic versioning (currently 1.0.0)
- [ ] **Build Number**: Incremented for each submission
- [ ] **Testing**: App thoroughly tested on physical devices

---

## After Upload

### 1. Processing

After upload, Apple processes your build (usually 15-60 minutes). You'll receive an email when it's ready.

### 2. App Store Connect Configuration

Go to [App Store Connect](https://appstoreconnect.apple.com):

1. Select your app
2. Go to **App Store** tab
3. Fill in all required information:
   - Description
   - Keywords
   - Support URL
   - Marketing URL (optional)
   - Screenshots
   - Privacy Policy URL
   - App Category
   - Age Rating

4. Go to **Pricing and Availability**
   - Set pricing (Free or Paid)
   - Select countries/regions

5. Select your build under **Build** section

6. Click **Submit for Review**

### 3. Review Process

- Review typically takes 24-48 hours
- You'll receive status updates via email
- Check App Store Connect for status

---

## Quick Start Commands

### Using EAS (Recommended):
```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

### Using Xcode:
```bash
cd mobile/ios
open TheComfortFinder.xcworkspace
# Then follow GUI steps in Xcode
```

---

## Environment Variables

Your production environment is already configured in `eas.json`:
- ✅ Clerk Live Key: Set
- ✅ Convex URL: Set
- ✅ API URL: Set to production

---

## Support Resources

- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **EAS Submit Docs**: https://docs.expo.dev/submit/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer Portal**: https://developer.apple.com

---

## Next Steps

1. Choose your upload method (EAS recommended)
2. Run the build command
3. Wait for processing
4. Configure App Store Connect
5. Submit for review

Good luck with your submission! 🚀

