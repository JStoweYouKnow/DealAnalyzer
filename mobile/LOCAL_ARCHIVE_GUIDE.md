# Local iOS Archive Build Guide (Without EAS)

Since EAS Build credits are exhausted, use these methods to create local archives for TestFlight/App Store.

---

## ✅ RECOMMENDED: Method 1 - Xcode IDE (Simplest)

The Xcode GUI often bypasses command-line sandbox restrictions.

### Steps:

```bash
# 1. Open the workspace
open /Users/v/Documents/DealAnalyzer/mobile/ios/TheComfortFinder.xcworkspace
```

Then in Xcode:
1. **Select Device:** Choose "Any iOS Device (arm64)" from device dropdown (NOT simulator)
2. **Clean Build:** Product → Clean Build Folder (⇧⌘K)
3. **Archive:** Product → Archive (⌃⌘B)
4. **Wait:** This takes 5-10 minutes
5. **Distribute:** When Organizer opens, click "Distribute App"

### If Archive Succeeds:
✅ You're done! Export for TestFlight or App Store.

### If Archive Fails with Sandbox Errors:
⬇️ Try Method 2

---

## 🔧 Method 2 - Disable Script Sandboxing

Xcode 14+ introduced script sandboxing which causes permission errors.

### Quick Fix in Xcode:

1. Open workspace: `open ios/TheComfortFinder.xcworkspace`
2. Select **TheComfortFinder** project in navigator (blue icon)
3. Select **TheComfortFinder** target
4. Click **Build Settings** tab
5. Search for: `ENABLE_USER_SCRIPT_SANDBOXING`
6. Change value to: **No** (for both Debug and Release)
7. Clean Build Folder (⇧⌘K)
8. Try Archive again

### Alternative - Command Line:

```bash
cd /Users/v/Documents/DealAnalyzer/mobile

# Add setting to pbxproj
/usr/libexec/PlistBuddy -c "Add :objects:PROJECT_REF:attributes:ENABLE_USER_SCRIPT_SANDBOXING bool NO" \
  ios/TheComfortFinder.xcodeproj/project.pbxproj 2>/dev/null || \
  echo "Setting may already exist"

# Try archive
cd ios
xcodebuild -workspace TheComfortFinder.xcworkspace \
  -scheme TheComfortFinder \
  -configuration Release \
  -sdk iphoneos \
  -archivePath ~/Desktop/TheComfortFinder.xcarchive \
  ENABLE_USER_SCRIPT_SANDBOXING=NO \
  archive
```

---

## 📦 Method 3 - Pre-Bundle JavaScript

Bundle the JavaScript ahead of time to avoid Node.js crashes during build.

### Steps:

```bash
cd /Users/v/Documents/DealAnalyzer/mobile

# 1. Pre-bundle JavaScript and assets
npx expo export:embed \
  --entry-file index.ts \
  --platform ios \
  --dev false \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/assets

# 2. Verify bundle was created
ls -lh ios/main.jsbundle

# 3. Open Xcode
open ios/TheComfortFinder.xcworkspace

# 4. Archive (Xcode will use existing bundle)
# Product → Archive
```

### What This Does:
- Creates `ios/main.jsbundle` with all JavaScript code
- Xcode's bundling script will detect existing bundle and skip bundling
- Avoids the Node.js "Bus error: 10" crash

---

## 🛠️ Method 4 - Use Legacy Build System

Older build system doesn't have sandbox restrictions.

### In Xcode:

1. File → Workspace Settings (or Project Settings)
2. Build System: Change from "New Build System" to **"Legacy Build System"**
3. Close and reopen Xcode
4. Try Archive again

⚠️ **Note:** Legacy build system is deprecated but still works.

---

## 🔍 Troubleshooting

### Error: "Bus error: 10"
**Solution:** Use Method 3 (Pre-bundle)

### Error: "Sandbox: deny file-read-data"
**Solution:** Use Method 2 (Disable sandboxing) or Method 1 (Xcode IDE)

### Error: "Signing requires a development team"
**Solution:** 
1. Xcode → TheComfortFinder target → Signing & Capabilities
2. Select your development team
3. Enable "Automatically manage signing"

### Error: "No profiles for 'com.comfortfinder.dealanalyzer'"
**Solution:**
1. Log into Apple Developer account in Xcode
2. Xcode → Settings → Accounts → Download Manual Profiles
3. Or create App ID and profiles at developer.apple.com

### Archive succeeds but "Export" fails
**Solution:** Check code signing settings and provisioning profiles

---

## 📱 After Successful Archive

### Upload to TestFlight:

1. In Xcode Organizer:
   - Click "Distribute App"
   - Select "App Store Connect"
   - Select "Upload"
   - Click "Next" through remaining steps

2. Wait 5-30 minutes for processing

3. Check TestFlight in App Store Connect

### Or Export IPA Manually:

```bash
# After archive succeeds
xcodebuild -exportArchive \
  -archivePath ~/Desktop/TheComfortFinder.xcarchive \
  -exportPath ~/Desktop/TheComfortFinder_IPA \
  -exportOptionsPlist ExportOptions.plist
```

---

## 💡 Tips for Faster Builds

1. **Close other apps** - Xcode needs RAM
2. **Use incremental builds** - Don't clean unless necessary
3. **Disable unnecessary build phases** temporarily
4. **Check Node.js version** - v20 LTS is most stable for React Native
5. **Clear derived data** if builds are acting weird:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/TheComfortFinder-*
   ```

---

## 📋 Quick Reference Commands

```bash
# Pre-bundle JavaScript
./pre-bundle-for-archive.sh

# Open in Xcode
open ios/TheComfortFinder.xcworkspace

# Clean everything
rm -rf ios/build ios/Pods ~/Library/Developer/Xcode/DerivedData/TheComfortFinder-*
cd ios && pod install && cd ..

# Archive via command line (if Xcode IDE doesn't work)
cd ios && xcodebuild -workspace TheComfortFinder.xcworkspace \
  -scheme TheComfortFinder -configuration Release -sdk iphoneos \
  -archivePath ~/Desktop/TheComfortFinder.xcarchive \
  ENABLE_USER_SCRIPT_SANDBOXING=NO archive
```

---

## ✅ Summary

**Best approach:**
1. Try Xcode IDE first (Method 1) - simplest
2. If fails, disable sandboxing (Method 2)
3. If still fails, pre-bundle JS (Method 3)

Most iOS developers find Method 1 or 2 sufficient. Method 3 is a reliable fallback.

---

**Need help?** Check the exported build reports:
- `Xcode_Build_Issues_Complete.md`
- `Build_Issues_Summary.md`

Good luck! 🚀




