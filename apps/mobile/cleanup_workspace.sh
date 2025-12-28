#!/bin/bash

BASE_DIR="/Users/v/Documents/DealAnalyzer/mobile"
cd "$BASE_DIR"

echo "🧹 Starting deep cleanup of $BASE_DIR..."

# 1. Nuke derived folders (safest to start fresh)
echo "🗑️ Removing node_modules and its clones..."
rm -rf node_modules*

echo "🗑️ Removing ios/Pods and its clones..."
rm -rf ios/Pods*

echo "🗑️ Removing ios/build and its clones..."
rm -rf ios/build*

# 2. Cleanup duplicates in the rest of the project
echo "🔍 Searching for other duplicate files/folders..."

# We use a pattern to find things ending with " 2", " 3", etc.
# Note: dealing with spaces in filenames is tricky in bash, using a safer loop.
find . -maxdepth 5 -name "* [0-9]" -o -name "* [0-9][0-9]" | while read dupe; do
    orig="${dupe% [0-9]}"
    # Handle cases with double digits if needed
    if [[ ! -e "$orig" ]]; then
        orig="${dupe% [0-9][0-9]}"
    fi

    if [[ -e "$orig" ]]; then
        # Use stat to get modification time in seconds since epoch
        dupe_time=$(stat -f "%m" "$dupe")
        orig_time=$(stat -f "%m" "$orig")
        
        if [ "$dupe_time" -gt "$orig_time" ]; then
            echo "🚀 Duplicate is newer: '$dupe' replacing '$orig'"
            rm -rf "$orig"
            mv "$dupe" "$orig"
        else
            echo "��️ Original is newer: deleting duplicate '$dupe'"
            rm -rf "$dupe"
        fi
    else
        # If there is no original, maybe it was just a failed copy? 
        # Or maybe it *is* the original that was renamed?
        # Better to keep it if no alternative exists.
        # But usually these are just junk from a bad sync.
        # Check if stripping the number yields a name that *should* exist.
        echo "❓ Found '$dupe' but no original '$orig'. Keeping for safety."
    fi
done

# 3. Clear Xcode DerivedData
echo "🌊 Clearing Xcode DerivedData..."
rm -rf ~/Library/Developer/Xcode/DerivedData/TheComfortFinder*

echo "✅ Cleanup complete! Reinstalling core dependencies..."
/opt/homebrew/opt/node@20/bin/node /usr/local/bin/npm install

echo "📦 Reinstalling iOS Pods..."
cd ios
/usr/local/bin/pod install

echo "✨ All done! Please try building again."
