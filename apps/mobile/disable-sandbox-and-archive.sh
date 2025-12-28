#!/bin/bash
set -e

echo "🔧 Attempting to archive with sandbox workarounds..."
echo ""

# Method 1: Set build setting to disable sandbox
echo "📝 Creating xcconfig to disable sandboxing..."
cat > ios/DisableSandbox.xcconfig << 'XCCONFIG'
// Disable user script sandboxing to avoid permission errors
ENABLE_USER_SCRIPT_SANDBOXING = NO
XCCONFIG

echo "✅ Created ios/DisableSandbox.xcconfig"
echo ""
echo "⚠️  You need to:"
echo "1. Open Xcode: open ios/TheComfortFinder.xcworkspace"
echo "2. Select TheComfortFinder project → Info tab"
echo "3. Under Configurations → Release"
echo "4. Set to 'DisableSandbox' for TheComfortFinder target"
echo "5. Or manually set ENABLE_USER_SCRIPT_SANDBOXING = NO in Build Settings"
echo ""
echo "Then try: Product → Archive"
