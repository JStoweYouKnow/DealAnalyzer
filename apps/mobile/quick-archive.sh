#!/bin/bash
# Quick Archive Helper Script

echo "🚀 TheComfortFinder - Quick Archive Helper"
echo "=========================================="
echo ""
echo "Choose a method:"
echo ""
echo "1) Open in Xcode IDE (Recommended - easiest)"
echo "2) Pre-bundle JavaScript then open Xcode"
echo "3) Archive via command line (disable sandbox)"
echo "4) Show troubleshooting guide"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
  1)
    echo ""
    echo "✅ Opening Xcode..."
    echo ""
    echo "📝 Next steps in Xcode:"
    echo "  1. Select 'Any iOS Device' from device dropdown"
    echo "  2. Product → Archive (or Ctrl+Cmd+B)"
    echo "  3. Wait for archive to complete"
    echo ""
    open ios/TheComfortFinder.xcworkspace
    ;;
    
  2)
    echo ""
    echo "📦 Pre-bundling JavaScript..."
    npx expo export:embed \
      --entry-file index.ts \
      --platform ios \
      --dev false \
      --bundle-output ios/main.jsbundle \
      --assets-dest ios/assets
    
    echo ""
    echo "✅ Bundle created at ios/main.jsbundle"
    echo ""
    echo "Opening Xcode..."
    open ios/TheComfortFinder.xcworkspace
    echo ""
    echo "📝 In Xcode: Product → Archive"
    ;;
    
  3)
    echo ""
    echo "🔨 Attempting command-line archive..."
    echo ""
    cd ios
    xcodebuild -workspace TheComfortFinder.xcworkspace \
      -scheme TheComfortFinder \
      -configuration Release \
      -sdk iphoneos \
      -archivePath ~/Desktop/TheComfortFinder.xcarchive \
      ENABLE_USER_SCRIPT_SANDBOXING=NO \
      archive
    
    if [ $? -eq 0 ]; then
      echo ""
      echo "✅ Archive succeeded!"
      echo "📍 Location: ~/Desktop/TheComfortFinder.xcarchive"
      echo ""
      echo "To export:"
      echo "  1. Open Xcode → Window → Organizer"
      echo "  2. Select the archive → Distribute App"
    else
      echo ""
      echo "❌ Archive failed. Try method 1 or 2 instead."
    fi
    ;;
    
  4)
    echo ""
    cat << 'HELP'
📚 Troubleshooting Guide
========================

Issue: Sandbox permission errors
Solution: Try Method 1 (Xcode IDE) or disable sandboxing in Build Settings

Issue: "Bus error: 10" 
Solution: Use Method 2 (pre-bundle JavaScript)

Issue: Build succeeds but Archive fails
Solution: Check Build Settings → ENABLE_USER_SCRIPT_SANDBOXING = NO

Issue: No development team selected
Solution: Xcode → Signing & Capabilities → Select your team

For complete guide: open LOCAL_ARCHIVE_GUIDE.md

HELP
    ;;
    
  *)
    echo "Invalid choice. Run script again."
    exit 1
    ;;
esac
