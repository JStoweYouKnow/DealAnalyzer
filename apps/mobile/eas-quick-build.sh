#!/bin/bash

# Quick EAS Build Script - Handles uncommitted changes

echo "🚀 EAS Quick Build - The Comfort Finder"
echo "========================================"
echo ""

cd /Users/v/Documents/DealAnalyzer/mobile

# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes."
    echo ""
    echo "Options:"
    echo "1) Commit changes and build"
    echo "2) Stash changes and build"
    echo "3) Build anyway (use --non-interactive)"
    echo ""
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            echo ""
            echo "📝 Committing changes..."
            cd /Users/v/Documents/DealAnalyzer
            git add -A
            git commit --no-verify -m "Build: App Store upload preparation"
            cd mobile
            ;;
        2)
            echo ""
            echo "📦 Stashing changes..."
            cd /Users/v/Documents/DealAnalyzer
            git stash push -m "EAS build stash $(date +%Y%m%d_%H%M%S)"
            cd mobile
            ;;
        3)
            echo ""
            echo "⚡️ Building without committing..."
            ;;
        *)
            echo "❌ Invalid choice"
            exit 1
            ;;
    esac
fi

echo ""
echo "🔨 Starting EAS build..."
echo ""

# Build with production profile
eas build --platform ios --profile production --non-interactive

BUILD_EXIT_CODE=$?

if [ $BUILD_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "✅ Build started successfully!"
    echo ""
    echo "📤 Submitting to App Store..."
    eas submit --platform ios --profile production --non-interactive
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "🎉 Build and submission complete!"
        echo "📧 Check your email for status updates"
        echo "🌐 Monitor at: https://expo.dev/accounts/project-comfort-dev/projects/deal-analyzer-mobile/builds"
    else
        echo ""
        echo "⚠️  Submission failed. You can submit manually later with:"
        echo "   eas submit --platform ios --profile production"
    fi
else
    echo ""
    echo "❌ Build failed. Check the error above."
    exit 1
fi

