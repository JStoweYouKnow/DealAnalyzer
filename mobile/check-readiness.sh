#!/bin/bash

# Pre-Upload Readiness Check Script
# Verifies that everything is in place before uploading to App Store

echo "🔍 The Comfort Finder - Readiness Check"
echo "========================================"
echo ""

ERRORS=0
WARNINGS=0

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    echo "   cd mobile && ./check-readiness.sh"
    exit 1
fi

echo "📋 Checking configuration files..."
echo ""

# Check app.json
if [ -f "app.json" ]; then
    echo "✅ app.json found"
    
    # Check version
    VERSION=$(grep -o '"version": "[^"]*"' app.json | cut -d'"' -f4)
    echo "   Version: $VERSION"
    
    # Check bundle ID
    BUNDLE_ID=$(grep -o '"bundleIdentifier": "[^"]*"' app.json | cut -d'"' -f4)
    echo "   Bundle ID: $BUNDLE_ID"
else
    echo "❌ app.json not found"
    ((ERRORS++))
fi

echo ""

# Check eas.json
if [ -f "eas.json" ]; then
    echo "✅ eas.json found"
    
    # Check if production profile exists
    if grep -q '"production"' eas.json; then
        echo "   ✅ Production profile configured"
    else
        echo "   ⚠️  Production profile not found"
        ((WARNINGS++))
    fi
    
    # Check if submit config exists
    if grep -q '"submit"' eas.json; then
        echo "   ✅ Submit configuration found"
    else
        echo "   ⚠️  Submit configuration not found"
        ((WARNINGS++))
    fi
else
    echo "❌ eas.json not found"
    ((ERRORS++))
fi

echo ""

# Check ASC API Key
if [ -f "asc-api-key.p8" ]; then
    echo "✅ ASC API Key (asc-api-key.p8) found"
else
    echo "⚠️  ASC API Key not found - you'll need this for automated submission"
    echo "   You can still upload manually via Xcode"
    ((WARNINGS++))
fi

echo ""

# Check iOS directory
if [ -d "ios" ]; then
    echo "✅ iOS directory found"
    
    # Check for workspace
    if [ -f "ios/TheComfortFinder.xcworkspace/contents.xcworkspacedata" ]; then
        echo "   ✅ Xcode workspace found"
    else
        echo "   ⚠️  Xcode workspace not found - run 'pod install'"
        ((WARNINGS++))
    fi
    
    # Check Info.plist
    if [ -f "ios/TheComfortFinder/Info.plist" ]; then
        echo "   ✅ Info.plist found"
    else
        echo "   ❌ Info.plist not found"
        ((ERRORS++))
    fi
    
    # Check for app icon
    if [ -f "ios/TheComfortFinder/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png" ]; then
        echo "   ✅ App icon (1024x1024) found"
    else
        echo "   ⚠️  App icon not found"
        ((WARNINGS++))
    fi
else
    echo "❌ iOS directory not found"
    ((ERRORS++))
fi

echo ""

# Check assets
echo "📦 Checking assets..."
echo ""

if [ -f "assets/icon.png" ]; then
    echo "✅ App icon asset found"
else
    echo "⚠️  assets/icon.png not found"
    ((WARNINGS++))
fi

if [ -f "assets/splash-icon.png" ]; then
    echo "✅ Splash screen asset found"
else
    echo "⚠️  assets/splash-icon.png not found"
    ((WARNINGS++))
fi

echo ""

# Check for EAS CLI
echo "🔧 Checking tools..."
echo ""

if command -v eas &> /dev/null; then
    echo "✅ EAS CLI installed"
    EAS_VERSION=$(eas --version 2>/dev/null || echo "unknown")
    echo "   Version: $EAS_VERSION"
else
    echo "⚠️  EAS CLI not installed"
    echo "   Install with: npm install -g eas-cli"
    ((WARNINGS++))
fi

if command -v pod &> /dev/null; then
    echo "✅ CocoaPods installed"
    POD_VERSION=$(pod --version 2>/dev/null || echo "unknown")
    echo "   Version: $POD_VERSION"
else
    echo "⚠️  CocoaPods not installed"
    echo "   Install with: sudo gem install cocoapods"
    ((WARNINGS++))
fi

echo ""

# Check environment variables in eas.json
echo "🌍 Checking environment variables..."
echo ""

if grep -q "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY" eas.json; then
    if grep -q "pk_live" eas.json; then
        echo "✅ Clerk live key configured"
    else
        echo "⚠️  Using Clerk test key - should use live key for production"
        ((WARNINGS++))
    fi
else
    echo "❌ Clerk key not configured"
    ((ERRORS++))
fi

if grep -q "EXPO_PUBLIC_CONVEX_URL" eas.json; then
    echo "✅ Convex URL configured"
else
    echo "❌ Convex URL not configured"
    ((ERRORS++))
fi

if grep -q "EXPO_PUBLIC_API_URL" eas.json; then
    API_URL=$(grep "EXPO_PUBLIC_API_URL" eas.json | grep -o 'https://[^"]*' | head -1)
    echo "✅ API URL configured: $API_URL"
else
    echo "❌ API URL not configured"
    ((ERRORS++))
fi

echo ""
echo "========================================"
echo ""

# Summary
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo "🎉 All checks passed! You're ready to upload!"
    echo ""
    echo "Next steps:"
    echo "  1. Run: ./upload-to-appstore.sh"
    echo "  2. Select option 1 for automated build + submit"
    echo "  3. Wait for build to complete (~20-30 minutes)"
    echo "  4. Complete App Store Connect setup"
    echo "  5. Submit for review"
    exit 0
elif [ $ERRORS -eq 0 ]; then
    echo "⚠️  $WARNINGS warning(s) found, but you can proceed"
    echo ""
    echo "You can still upload, but consider fixing the warnings above."
    echo ""
    echo "To proceed:"
    echo "  Run: ./upload-to-appstore.sh"
    exit 0
else
    echo "❌ $ERRORS error(s) and $WARNINGS warning(s) found"
    echo ""
    echo "Please fix the errors above before uploading."
    exit 1
fi

