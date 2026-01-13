# Immediate Fix for "No script URL provided" Error

## The Problem
Metro bundler is getting stuck when trying to create bundles. For immediate testing, we need Metro running.

## Quick Solution (Choose One)

### Option 1: Build in DEBUG Mode (Easiest)

**In Xcode:**
1. Product → Scheme → Edit Scheme
2. Select "Run" on the left
3. Set "Build Configuration" to **Debug** (not Release)
4. Close the scheme editor
5. Build and Run (Cmd+R)

Debug mode always uses Metro bundler, so you don't need a bundle file.

### Option 2: Start Metro Manually

1. **Open a terminal** and run:
   ```bash
   cd apps/mobile
   ./START_METRO.sh
   ```
   OR manually:
   ```bash
   cd apps/mobile
   npx expo start
   ```

2. **Keep Metro running** - don't close the terminal

3. **In Xcode**, build in Release mode - the app will connect to Metro

4. **Important**: Make sure your device and Mac are on the **same WiFi network**

### Option 3: Use EAS Build (For Production)

For production builds that don't require Metro:
```bash
cd apps/mobile
eas build --platform ios --profile preview
```

EAS handles bundling automatically.

## Why Metro Gets Stuck

Metro/Expo export can hang due to:
- Large dependency trees
- Cache issues
- Network timeouts
- Memory issues

## If Metro Still Hangs

1. **Clear caches**:
   ```bash
   cd apps/mobile
   rm -rf .expo node_modules/.cache
   npx expo start --clear
   ```

2. **Use Debug mode** instead (Option 1 above)

3. **Use EAS Build** for production (Option 3 above)

## Recommended Approach

For **development/testing**: Use **Debug mode** in Xcode (Option 1)
For **production/App Store**: Use **EAS Build** (Option 3)








