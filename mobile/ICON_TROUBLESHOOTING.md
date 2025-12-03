# App Icon Troubleshooting Guide

## Why the Icon Might Not Show Up

### 1. **Expo Go Limitation** ⚠️
**Expo Go doesn't display custom app icons.** The icon only appears in:
- Development builds (`npx expo run:ios` or `npx expo run:android`)
- Production builds (EAS Build)
- Standalone apps

**Solution**: Create a development build instead of using Expo Go.

### 2. **Icon Not Regenerated**
After updating the icon, you need to regenerate native assets.

**Solution**: Run prebuild to regenerate native assets:
```bash
cd mobile
npx expo prebuild --clean
```

### 3. **iOS Simulator Cache**
The iOS simulator sometimes caches the old icon.

**Solution**: 
1. Delete the app from the simulator
2. Rebuild and reinstall:
   ```bash
   npx expo run:ios
   ```

### 4. **Icon File Issues**
Verify the icon meets requirements:
- ✅ Size: 1024x1024 pixels
- ✅ Format: PNG
- ✅ No transparency (for iOS)
- ✅ Square aspect ratio

## Quick Fixes

### Option 1: Create Development Build (Recommended)
```bash
cd mobile
npx expo run:ios
# or
npx expo run:android
```

This creates a development build with your custom icon.

### Option 2: Regenerate Assets
```bash
cd mobile
npx expo prebuild --clean
npx expo run:ios
```

### Option 3: Clear Cache and Rebuild
```bash
cd mobile
# Clear Expo cache
npx expo start --clear

# For iOS simulator, delete the app manually, then:
npx expo run:ios
```

## Icon Requirements

### iOS
- **Size**: 1024x1024 pixels
- **Format**: PNG
- **No transparency**: iOS requires opaque icons
- **File**: `assets/icon.png`

### Android
- **Foreground**: 1024x1024 pixels (can have transparency)
- **Background**: Solid color
- **Files**: 
  - `assets/adaptive-icon.png` (foreground)
  - Background color set in `app.json`

## Current Configuration ✅

Your `app.json` is correctly configured:
```json
{
  "icon": "./assets/icon.png",
  "ios": {
    // ... iOS config
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#6B806B"
    }
  }
}
```

## Verification Steps

1. **Check icon file exists**:
   ```bash
   ls -lh mobile/assets/icon.png
   ```

2. **Verify icon dimensions**:
   ```bash
   sips -g pixelWidth -g pixelHeight mobile/assets/icon.png
   ```
   Should show: 1024x1024

3. **Test in development build**:
   ```bash
   cd mobile
   npx expo run:ios
   ```

## If Still Not Working

1. **Check if using Expo Go**: Switch to development build
2. **Verify icon file**: Ensure it's not corrupted
3. **Regenerate assets**: Run `npx expo prebuild --clean`
4. **Check build logs**: Look for icon-related warnings
5. **Try a test icon**: Replace with a simple colored square to test

## Production Build

For production builds (App Store/Play Store), the icon will definitely work:
```bash
cd mobile
eas build --platform ios --profile production
```


