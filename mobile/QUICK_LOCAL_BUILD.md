# Quick Guide: Build iOS Locally for TestFlight (Free)

## Prerequisites
- ✅ Mac computer
- ✅ Xcode installed (free from App Store)
- ✅ Apple Developer account ($99/year - required for TestFlight)

## Step-by-Step

### 1. Generate iOS Project

```bash
cd mobile
npx expo prebuild --platform ios
```

This creates the `ios/` folder with native Xcode project.

### 2. Open in Xcode

```bash
open ios/deal-analyzer-mobile.xcworkspace
```

**Important**: Open the `.xcworkspace` file, NOT the `.xcodeproj` file!

### 3. Configure Signing

In Xcode:
1. Select project in left sidebar: `TheComfortFinder`
2. Select target: `TheComfortFinder`
3. Go to **"Signing & Capabilities"** tab
4. Check **"Automatically manage signing"**
5. Select your **Team** (your Apple Developer account)
6. Xcode will automatically:
   - Create/update provisioning profiles
   - Manage certificates
   - Configure bundle identifier

### 4. Build Archive

1. In Xcode menu: **Product → Destination → Any iOS Device** (or your connected device)
2. **Product → Archive**
3. Wait for build to complete (5-15 minutes first time)
4. Xcode Organizer window will open automatically

### 5. Upload to TestFlight

In Xcode Organizer:
1. Select your archive
2. Click **"Distribute App"**
3. Choose **"App Store Connect"**
4. Click **"Next"**
5. Choose **"Upload"** (not "Export")
6. Click **"Next"**
7. Review options, click **"Upload"**
8. Wait for upload to complete (5-10 minutes)

### 6. Verify in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Navigate to your app: **"The Comfort Finder"**
3. Go to **"TestFlight"** tab
4. Your build should appear within 10-30 minutes
5. Process the build (may take additional time)
6. Once processed, add testers!

## Troubleshooting

### "No signing certificate found"
- Go to Xcode → Preferences → Accounts
- Add your Apple ID
- Download certificates manually if needed

### "Bundle identifier already exists"
- Change bundle identifier in Xcode: `com.comfortfinder.dealanalyzer` → `com.comfortfinder.dealanalyzer2`
- Or use existing app in App Store Connect

### Build fails with "Module not found"
```bash
cd mobile/ios
pod install
```
Then rebuild in Xcode.

### Archive button is grayed out
- Select "Any iOS Device" as destination (not simulator)
- Or connect a physical iOS device

## Time Estimates

- First build: 15-20 minutes
- Subsequent builds: 5-10 minutes
- Upload: 5-10 minutes
- Processing in TestFlight: 10-30 minutes

**Total**: ~30-60 minutes from start to TestFlight

## Advantages

✅ **Completely free** - no build quotas  
✅ **Fast** - uses your Mac's resources  
✅ **Full control** - see all build logs  
✅ **No waiting** - build anytime you want  

## Next Steps After Upload

1. Wait for build to process in App Store Connect
2. Add internal testers (up to 100)
3. Submit for external testing (if needed)
4. Share TestFlight link with testers

## Quick Reference

```bash
# Generate iOS project
cd mobile && npx expo prebuild --platform ios

# Open in Xcode
open ios/TheComfortFinder.xcworkspace

# If pods need updating
cd ios && pod install && cd ..
```

That's it! This is the fastest free way to get builds to TestFlight.

