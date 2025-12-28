#!/bin/bash
# Script to fix iOS React Native linker errors
#
# These errors occur when CocoaPods dependencies are corrupted or outdated
# This script will clean and reinstall all iOS dependencies
#
# Usage: bash fix-ios-build.sh

set -e

echo "🧹 Cleaning iOS build artifacts..."
cd mobile/ios

# Remove pods and build artifacts
rm -rf Pods
rm -rf Podfile.lock
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData/TheComfortFinder-*

echo ""
echo "📦 Reinstalling CocoaPods dependencies..."
pod install

echo ""
echo "✅ iOS dependencies reinstalled successfully!"
echo ""
echo "Now you can:"
echo "  1. Open ios/TheComfortFinder.xcworkspace in Xcode"
echo "  2. Clean build folder (Cmd+Shift+K)"
echo "  3. Build and run (Cmd+R)"
echo ""
echo "Or run from command line:"
echo "  npx react-native run-ios"
