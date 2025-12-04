# Xcode Build Steps - Quick Reference

## ✅ Step 1: iOS Project Generated

The iOS project has been generated and Xcode should now be opening.

## Step 2: Configure Signing in Xcode

Once Xcode opens:

1. **Select the project** in the left sidebar (top item: `TheComfortFinder`)

2. **Select the target** (should be `TheComfortFinder` under "TARGETS")

3. **Go to "Signing & Capabilities" tab**

4. **Check "Automatically manage signing"**

5. **Select your Team**:
   - If you see your Apple Developer account, select it
   - If not, click "+" to add your Apple ID
   - Xcode will automatically:
     - Create provisioning profiles
     - Manage certificates
     - Configure bundle identifier: `com.comfortfinder.dealanalyzer`

6. **Verify Bundle Identifier** matches:
   ```
   com.comfortfinder.dealanalyzer
   ```

## Step 3: Select Build Destination

Before archiving, you need to select a device:

1. **In Xcode toolbar**, click the device selector (next to the play/stop buttons)
2. **Select "Any iOS Device"** (not a simulator)
   - This is required for creating an archive

## Step 4: Build Archive

1. **Product → Archive**
   - Or press: `Cmd + Shift + B` then select "Archive"
   - First build may take 10-15 minutes
   - Subsequent builds: 5-10 minutes

2. **Wait for build to complete**
   - Progress shown in Xcode's activity viewer
   - Check for any errors in the issue navigator (⚠️ icon)

3. **Xcode Organizer will open automatically** when archive is ready

## Step 5: Upload to TestFlight

In Xcode Organizer:

1. **Select your archive** (should be the most recent one)

2. **Click "Distribute App"**

3. **Choose distribution method**:
   - Select **"App Store Connect"**
   - Click **"Next"**

4. **Choose upload option**:
   - Select **"Upload"** (not "Export")
   - Click **"Next"**

5. **Review options**:
   - Distribution options: Leave defaults
   - App Thinning: "All compatible device variants"
   - Click **"Next"**

6. **Review signing**:
   - Xcode will automatically manage signing
   - Click **"Upload"**

7. **Wait for upload**:
   - Progress shown in Organizer
   - Usually takes 5-10 minutes
   - You'll see "Upload Succeeded" when done

## Step 6: Verify in App Store Connect

1. Go to [App Store Connect](https://appstoreconnect.apple.com)

2. Navigate to your app: **"The Comfort Finder"**

3. Go to **"TestFlight"** tab

4. Your build should appear within **10-30 minutes**

5. **Process the build**:
   - Click on the build
   - Wait for processing to complete (may take additional time)
   - You'll see a green checkmark when ready

6. **Add testers**:
   - Internal testers: Up to 100 (instant)
   - External testers: Up to 10,000 (requires review)

## Troubleshooting

### "No signing certificate found"
- Go to **Xcode → Settings → Accounts**
- Add your Apple ID if not present
- Select your account and click **"Download Manual Profiles"**

### "Bundle identifier already exists"
- This means the app already exists in App Store Connect
- This is fine - just continue with the upload
- The build will be added to the existing app

### Archive button is grayed out
- Make sure you selected **"Any iOS Device"** as destination
- Not a simulator (simulators can't create archives)

### Build errors
- Check the **Issue Navigator** (⚠️ icon in left sidebar)
- Common fixes:
  ```bash
  cd ios
  pod install
  cd ..
  ```
  Then rebuild in Xcode

### "Module not found" errors
```bash
cd mobile/ios
pod install
```
Then rebuild in Xcode.

## Quick Commands

```bash
# Regenerate iOS project (if needed)
cd mobile
npx expo prebuild --platform ios --clean

# Open in Xcode
open ios/TheComfortFinder.xcworkspace

# Update CocoaPods (if needed)
cd ios
pod install
```

## Time Estimates

- First build: 15-20 minutes
- Subsequent builds: 5-10 minutes  
- Upload: 5-10 minutes
- Processing in TestFlight: 10-30 minutes

**Total**: ~30-60 minutes from archive to TestFlight

## Next Steps After Upload

1. ✅ Wait for build to process in App Store Connect
2. ✅ Add internal testers (up to 100)
3. ✅ Submit for external testing (if needed)
4. ✅ Share TestFlight link with testers

You're all set! The iOS project is ready to build. 🚀

