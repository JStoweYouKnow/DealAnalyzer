#!/bin/bash
set -e

echo "🎯 Pre-bundling JavaScript for Xcode Archive..."

# Bundle JavaScript
npx expo export:embed \
  --entry-file index.ts \
  --platform ios \
  --dev false \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/

echo "✅ JavaScript bundle created at ios/main.jsbundle"
echo "📦 Assets copied to ios/"
echo ""
echo "Now archive in Xcode:"
echo "1. Open: open ios/TheComfortFinder.xcworkspace"
echo "2. Product → Archive"
echo ""
echo "⚠️  Note: Xcode will skip bundling since main.jsbundle already exists"
