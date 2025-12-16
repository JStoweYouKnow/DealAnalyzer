#!/bin/bash
# Test Crash Fixes Locally Before Uploading

set -e

echo "🧪 Testing Crash Prevention Fixes"
echo "=================================="
echo ""

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules not found. Running npm install..."
  npm install
fi

echo "✅ Dependencies OK"
echo ""

# Run type check
echo "🔍 Running TypeScript type check..."
npm run type-check
echo "✅ No type errors"
echo ""

# Check for common issues
echo "🔍 Checking for common crash patterns..."
echo ""

# Check if error boundary is imported
if grep -q "ErrorBoundary" App.tsx; then
  echo "✅ Error Boundary: Implemented"
else
  echo "❌ Error Boundary: Missing"
  exit 1
fi

# Check if global error handlers are setup
if grep -q "setupGlobalErrorHandlers" App.tsx; then
  echo "✅ Global Error Handlers: Configured"
else
  echo "❌ Global Error Handlers: Missing"
  exit 1
fi

# Check if navigation guards exist
if [ -f "src/utils/navigationGuards.ts" ]; then
  echo "✅ Navigation Guards: Present"
else
  echo "❌ Navigation Guards: Missing"
  exit 1
fi

# Check if screens config exists
if [ -f "src/screens/ScreensConfig.tsx" ]; then
  echo "✅ Screens Config: Present"
else
  echo "❌ Screens Config: Missing"
  exit 1
fi

echo ""
echo "🎯 All crash prevention measures verified!"
echo ""
echo "📱 Next Steps:"
echo "  1. Test locally: npm run ios"
echo "  2. Test navigation scenarios:"
echo "     - Rapidly tap navigation buttons"
echo "     - Navigate back and forth quickly"
echo "     - Switch between tabs"
echo "  3. Watch console for:"
echo "     ✅ '[Navigation] Blocked rapid navigation' (good)"
echo "     ✅ '🚨 Error Boundary Caught' (error caught, not crashed)"
echo "  4. If no crashes, build for TestFlight:"
echo "     ./quick-archive.sh"
echo ""
echo "🚀 Ready to test!"




