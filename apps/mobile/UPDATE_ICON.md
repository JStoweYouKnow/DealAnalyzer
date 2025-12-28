# 📱 Updating App Icon

To add your logo as the app icon, you need to:

## Step 1: Prepare Your Icon Image

Your app icon needs to be:
- **1024x1024 pixels** (square)
- **PNG format** (no transparency for iOS, can have transparency for Android)
- **No rounded corners** (iOS/Android will add them automatically)

## Step 2: Replace the Icon Files

### Main Icon (iOS & General)
```bash
# Copy your logo to the main icon location
cp /path/to/your/logo.png mobile/assets/icon.png
```

### Android Adaptive Icon
For Android, you may want to create an adaptive icon:
- **Foreground**: Your logo (can be smaller, centered)
- **Background**: Solid color (matches your logo background - olive green #6B806B)

```bash
# For Android adaptive icon foreground
cp /path/to/your/logo.png mobile/assets/adaptive-icon.png
```

Then update `app.json` Android section:
```json
"android": {
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#6B806B"  // Your olive green color
  }
}
```

### Splash Screen Icon (Optional)
You can also use your logo for the splash screen:
```bash
cp /path/to/your/logo.png mobile/assets/splash-icon.png
```

## Step 3: Resize if Necessary

If your image isn't 1024x1024, use ImageMagick or another tool:

```bash
# Using ImageMagick (install with: brew install imagemagick)
convert your-logo.png -resize 1024x1024 -background white -gravity center -extent 1024x1024 mobile/assets/icon.png

# Or using sips (built into macOS)
sips -z 1024 1024 your-logo.png --out mobile/assets/icon.png
```

## Step 4: Verify

After updating, verify the icon:
```bash
cd mobile/assets
file icon.png
# Should show: PNG image data, 1024 x 1024
```

## Quick Command (if you have the logo file)

If your logo file is at `/path/to/your/logo.png`:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile/assets

# Resize and copy main icon
sips -z 1024 1024 /path/to/your/logo.png --out icon.png

# Copy for adaptive icon (Android)
cp icon.png adaptive-icon.png

# Update app.json background color to match your logo
# Edit app.json and set backgroundColor to "#6B806B"
```

## Notes

- The icon will be automatically rounded by iOS/Android
- Make sure your logo is centered and has some padding (safe area)
- Test on both iOS and Android simulators after updating
- Rebuild the app to see changes: `eas build --platform ios --profile development`


