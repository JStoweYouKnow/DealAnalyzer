#!/bin/bash
# Script to update app icon with your logo

set -e

ICON_SIZE=1024
ASSETS_DIR="$(dirname "$0")/assets"

echo "📱 App Icon Update Script"
echo ""

# Check if ImageMagick or sips is available
if command -v convert &> /dev/null; then
    RESIZE_TOOL="imagemagick"
elif command -v sips &> /dev/null; then
    RESIZE_TOOL="sips"
else
    echo "❌ Error: Need ImageMagick or sips to resize images"
    echo "   Install ImageMagick: brew install imagemagick"
    echo "   Or use sips (built into macOS)"
    exit 1
fi

# Get logo file path
if [ -z "$1" ]; then
    echo "Usage: ./update-icon.sh /path/to/your/logo.png"
    echo ""
    echo "Or drag and drop your logo file into the terminal after typing:"
    echo "  ./update-icon.sh "
    exit 1
fi

LOGO_FILE="$1"

if [ ! -f "$LOGO_FILE" ]; then
    echo "❌ Error: Logo file not found: $LOGO_FILE"
    exit 1
fi

echo "✅ Found logo file: $LOGO_FILE"
echo ""

# Get current dimensions
if [ "$RESIZE_TOOL" = "sips" ]; then
    DIMENSIONS=$(sips -g pixelWidth -g pixelHeight "$LOGO_FILE" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
else
    DIMENSIONS=$(identify -format "%wx%h" "$LOGO_FILE" 2>/dev/null)
fi

echo "📐 Current dimensions: $DIMENSIONS"
echo "🎯 Target size: ${ICON_SIZE}x${ICON_SIZE}"
echo ""

# Resize and create icon
echo "🔄 Resizing and creating icon..."
if [ "$RESIZE_TOOL" = "sips" ]; then
    # Use sips to resize (macOS built-in)
    sips -z $ICON_SIZE $ICON_SIZE "$LOGO_FILE" --out "$ASSETS_DIR/icon.png" > /dev/null 2>&1
    echo "✅ Created icon.png (1024x1024)"
    
    # Also create adaptive icon for Android
    cp "$ASSETS_DIR/icon.png" "$ASSETS_DIR/adaptive-icon.png"
    echo "✅ Created adaptive-icon.png"
else
    # Use ImageMagick
    convert "$LOGO_FILE" -resize "${ICON_SIZE}x${ICON_SIZE}" -background white -gravity center -extent "${ICON_SIZE}x${ICON_SIZE}" "$ASSETS_DIR/icon.png"
    echo "✅ Created icon.png (1024x1024)"
    
    # Also create adaptive icon for Android
    cp "$ASSETS_DIR/icon.png" "$ASSETS_DIR/adaptive-icon.png"
    echo "✅ Created adaptive-icon.png"
fi

# Verify
if [ -f "$ASSETS_DIR/icon.png" ]; then
    if [ "$RESIZE_TOOL" = "sips" ]; then
        NEW_DIM=$(sips -g pixelWidth -g pixelHeight "$ASSETS_DIR/icon.png" 2>/dev/null | grep -E "pixelWidth|pixelHeight" | awk '{print $2}' | tr '\n' 'x' | sed 's/x$//')
    else
        NEW_DIM=$(identify -format "%wx%h" "$ASSETS_DIR/icon.png" 2>/dev/null)
    fi
    echo ""
    echo "✅ Verification: icon.png is now $NEW_DIM"
    echo ""
    echo "📝 Next steps:"
    echo "1. Update app.json Android backgroundColor to match your logo background"
    echo "2. Test the icon: eas build --platform ios --profile development"
    echo ""
    echo "🎉 Icon update complete!"
else
    echo "❌ Error: Failed to create icon.png"
    exit 1
fi


