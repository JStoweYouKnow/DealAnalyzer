#!/bin/bash
set -e
cd "$(dirname "$0")"

echo "📦 Creating JavaScript bundle..."

# Use Metro bundler directly to create bundle
npx metro --config metro.config.js \
  --entry-file index.ts \
  --platform ios \
  --dev false \
  --bundle-output ios/main.jsbundle \
  --assets-dest ios/ \
  --reset-cache

if [ -f "ios/main.jsbundle" ]; then
  echo "✅ Bundle created: ios/main.jsbundle"
  ls -lh ios/main.jsbundle
else
  echo "❌ Bundle creation failed"
  exit 1
fi
