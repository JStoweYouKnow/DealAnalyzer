# Xcode Build Error Fix

## Error
```
error: Sandbox: bash(92170) deny(1) file-write-create /Users/v/Downloads/DealAnalyzer/mobile/ios/Pods/resources-to-copy-TheComfortFinder.txt
Operation not permitted
```

## Cause
CocoaPods doesn't have permission to write to the Pods directory. This is a file permissions issue.

## Solution

### Step 1: Fix Permissions
```bash
cd mobile/ios
chmod -R 755 Pods/
chmod -R 755 Pods/Target\ Support\ Files/
```

### Step 2: Clean and Reinstall Pods
```bash
cd mobile/ios
rm -f Pods/resources-to-copy-TheComfortFinder.txt
pod install
```

### Step 3: Clean Xcode Build
In Xcode:
1. **Product → Clean Build Folder** (Shift + Cmd + K)
2. Close Xcode
3. Delete DerivedData:
   ```bash
   rm -rf ~/Library/Developer/Xcode/DerivedData/TheComfortFinder-*
   ```
4. Reopen Xcode
5. Try building again

### Step 4: If Still Failing - Full Clean
```bash
cd mobile/ios
rm -rf Pods/
rm -rf Podfile.lock
pod install
```

Then in Xcode:
- Product → Clean Build Folder
- Try building again

## Alternative: Rebuild iOS Project

If permissions keep causing issues:

```bash
cd mobile
npx expo prebuild --platform ios --clean
cd ios
pod install
```

Then open in Xcode and build.

## Common Causes

1. **File permissions** - Pods directory not writable
2. **CocoaPods cache** - Corrupted cache files
3. **Xcode DerivedData** - Stale build artifacts
4. **Multiple Xcode versions** - Using wrong Xcode version

## Prevention

After fixing, ensure:
- Pods directory has correct permissions
- CocoaPods is up to date: `sudo gem install cocoapods`
- Xcode Command Line Tools are installed: `xcode-select --install`

