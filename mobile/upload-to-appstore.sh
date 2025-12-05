#!/bin/bash

# App Store Upload Script for The Comfort Finder
# This script helps you build and upload your app to the App Store

set -e  # Exit on error

echo "🚀 The Comfort Finder - App Store Upload Script"
echo "================================================"
echo ""

# Check if we're in the mobile directory
if [ ! -f "app.json" ]; then
    echo "❌ Error: Please run this script from the mobile directory"
    echo "   cd mobile && ./upload-to-appstore.sh"
    exit 1
fi

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 EAS CLI not found. Installing..."
    npm install -g eas-cli
    echo "✅ EAS CLI installed"
else
    echo "✅ EAS CLI found"
fi

# Check if logged into EAS
echo ""
echo "Checking EAS authentication..."
if ! eas whoami &> /dev/null; then
    echo "🔐 Please login to EAS:"
    eas login
else
    echo "✅ Logged in as: $(eas whoami)"
fi

echo ""
echo "📋 Select upload method:"
echo "1) Build + Submit to App Store (Recommended)"
echo "2) Build only"
echo "3) Submit existing build"
echo "4) Open in Xcode (local build)"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🔨 Building for production..."
        eas build --platform ios --profile production --non-interactive
        
        echo ""
        echo "📤 Submitting to App Store..."
        eas submit --platform ios --profile production --non-interactive
        
        echo ""
        echo "✅ Build and submission complete!"
        echo "📧 Check your email for status updates"
        echo "🌐 Monitor progress at: https://appstoreconnect.apple.com"
        ;;
        
    2)
        echo ""
        echo "🔨 Building for production..."
        eas build --platform ios --profile production
        
        echo ""
        echo "✅ Build complete!"
        echo "💡 To submit, run: eas submit --platform ios --profile production"
        ;;
        
    3)
        echo ""
        echo "📤 Submitting to App Store..."
        eas submit --platform ios --profile production
        
        echo ""
        echo "✅ Submission complete!"
        ;;
        
    4)
        echo ""
        echo "🔧 Opening in Xcode..."
        
        # Check if workspace exists
        if [ ! -f "ios/TheComfortFinder.xcworkspace" ]; then
            echo "⚠️  Workspace not found. Running pod install..."
            cd ios
            pod install
            cd ..
        fi
        
        open ios/TheComfortFinder.xcworkspace
        
        echo ""
        echo "✅ Xcode opened!"
        echo ""
        echo "📝 Next steps in Xcode:"
        echo "   1. Select 'Any iOS Device' as target"
        echo "   2. Product → Archive"
        echo "   3. Distribute App → App Store Connect"
        ;;
        
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "🎉 Done!"

