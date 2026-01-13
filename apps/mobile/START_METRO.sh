#!/bin/bash
# Script to start Metro bundler for iOS development

cd "$(dirname "$0")"

echo "🚀 Starting Metro bundler..."
echo "📱 Make sure your device and Mac are on the same WiFi network"
echo ""

# Kill any existing Metro processes
pkill -f "expo\|metro" 2>/dev/null || true
sleep 1

# Start Expo/Metro bundler
npx expo start --ios --no-dev --minify








