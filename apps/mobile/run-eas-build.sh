#!/bin/bash
# Script to run EAS build with non-interactive flags and timeout protection
# This prevents the build from hanging on prompts or network issues

set -e

cd "$(dirname "$0")"

PROFILE="${1:-preview}"
PLATFORM="${2:-ios}"
TIMEOUT_SECONDS=${3:-900}  # 15 minutes default timeout (compression can take a while)

echo "🚀 Starting EAS build..."
echo "   Profile: $PROFILE"
echo "   Platform: $PLATFORM"
echo "   Timeout: $TIMEOUT_SECONDS seconds ($(($TIMEOUT_SECONDS / 60)) minutes)"
echo ""
echo "ℹ️  Note: Even with --no-wait, EAS waits for file compression/upload to complete."
echo "   This can take 5-15 minutes for large projects. The timeout will kill it if it hangs."
echo ""
echo "🔍 Pre-flight checks..."
# Check if EAS CLI is available
if command -v eas &> /dev/null; then
  echo "   ✅ EAS CLI found: $(which eas)"
else
  echo "   ⚠️  EAS CLI not found, will use npx"
fi
# Check expo config
echo "   📋 Testing expo config..."
if npx expo config --type public > /dev/null 2>&1; then
  echo "   ✅ expo config works"
else
  echo "   ⚠️  expo config may have issues"
fi
echo ""

# Run EAS build in background with timeout protection and verbose output
echo "📋 Running: eas build --platform $PLATFORM --profile $PROFILE --non-interactive --no-wait"
echo ""

# Create a log file to capture output
LOG_FILE="/tmp/eas-build-$$.log"
echo "📝 Logging to: $LOG_FILE"
echo ""

(
  # Use EAS CLI directly if available, otherwise use npx
  if command -v eas &> /dev/null; then
    eas build \
      --platform "$PLATFORM" \
      --profile "$PROFILE" \
      --non-interactive \
      --no-wait 2>&1 | tee "$LOG_FILE"
  else
    npx eas build \
      --platform "$PLATFORM" \
      --profile "$PROFILE" \
      --non-interactive \
      --no-wait 2>&1 | tee "$LOG_FILE"
  fi
) &
EAS_PID=$!

# Wait for the EAS build command to finish or timeout
WAIT_TIME=0
LAST_LOG_SIZE=0
while kill -0 $EAS_PID 2>/dev/null && [ $WAIT_TIME -lt $TIMEOUT_SECONDS ]; do
  sleep 5
  WAIT_TIME=$((WAIT_TIME + 5))
  
  # Show progress from log file if it's growing
  if [ -f "$LOG_FILE" ]; then
    CURRENT_LOG_SIZE=$(wc -c < "$LOG_FILE" 2>/dev/null || echo 0)
    if [ $CURRENT_LOG_SIZE -gt $LAST_LOG_SIZE ]; then
      echo ""
      echo "📋 Recent output:"
      tail -3 "$LOG_FILE" 2>/dev/null | sed 's/^/   /'
      LAST_LOG_SIZE=$CURRENT_LOG_SIZE
    fi
  fi
  
  if [ $((WAIT_TIME % 30)) -eq 0 ]; then
    echo ""
    echo "⏳ Still submitting build... ($WAIT_TIME seconds)"
    if [ -f "$LOG_FILE" ]; then
      echo "   Last 5 lines of output:"
      tail -5 "$LOG_FILE" 2>/dev/null | sed 's/^/   /'
    fi
  fi
done

# Check if process is still running
if kill -0 $EAS_PID 2>/dev/null; then
  echo ""
  echo "⚠️ EAS build submission is taking too long, killing process..."
  kill $EAS_PID 2>/dev/null || true
  wait $EAS_PID 2>/dev/null || true
  echo "❌ Build submission timed out after $TIMEOUT_SECONDS seconds"
  echo "💡 This might indicate a network issue or EAS server problem"
  echo "💡 Try again or check: https://expo.dev/accounts/project-comfort-dev/projects/deal-analyzer-mobile/builds"
  exit 1
fi

wait $EAS_PID
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  echo ""
  echo "✅ Build submitted successfully!"
  echo "   Monitor progress at: https://expo.dev/accounts/project-comfort-dev/projects/deal-analyzer-mobile/builds"
  rm -f "$LOG_FILE"
  exit 0
else
  echo ""
  echo "❌ Build submission failed with exit code: $EXIT_CODE"
  if [ -f "$LOG_FILE" ]; then
    echo ""
    echo "📋 Full output log:"
    cat "$LOG_FILE" | sed 's/^/   /'
    echo ""
    echo "💡 Log file saved at: $LOG_FILE"
  fi
  exit $EXIT_CODE
fi

