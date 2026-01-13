# Quick Fix for "No script URL provided" Crash

## The Problem

When building in Release mode directly in Xcode, the app crashes with "No script URL provided" because:
1. The JavaScript bundle (`main.jsbundle`) doesn't exist
2. Metro bundler isn't running for the fallback

## Immediate Solution (2 Options)

### Option 1: Start Metro Bundler (Quickest Fix)

**Before building/running in Xcode:**

1. Open a terminal
2. Navigate to the app directory:
   ```bash
   cd apps/mobile
   ```
3. Start Metro bundler:
   ```bash
   npx expo start
   ```
4. **Keep this terminal open** - Metro must be running
5. Make sure your device/Mac are on the **same WiFi network**
6. Build and run in Xcode - the app will use Metro bundler fallback

**Note**: The AppDelegate will automatically fallback to Metro if `main.jsbundle` is not found.

### Option 2: Create JavaScript Bundle (For Production)

**Before building in Xcode:**

1. Open a terminal
2. Navigate to the app directory:
   ```bash
   cd apps/mobile
   ```
3. Run the bundle script:
   ```bash
   ./ios/scripts/bundle-js.sh
   ```
4. This creates `ios/main.jsbundle`
5. Build and run in Xcode - the app will use the bundled JavaScript

## Verify It's Working

After building, check Xcode console for these logs:
- `[AppDelegate] 🚀 Starting app...`
- `[AppDelegate] ✅ Found main.jsbundle in app bundle` (if bundled)
- OR `[AppDelegate] ✅ Using Metro bundler fallback` (if Metro is running)

If you see `[AppDelegate] ❌ ERROR: Could not find JavaScript bundle or Metro bundler`, then:
- Metro isn't running (for Option 1)
- Bundle wasn't created (for Option 2)

## For Production/App Store Builds

Always use Option 2 (create bundle) before archiving. See `ios/BUNDLE_SETUP.md` for automatic bundling setup.








