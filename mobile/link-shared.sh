#!/bin/bash

# Script to create symlinks to shared code from the web app
# This allows the mobile app to reuse types and schemas

SHARED_DIR="../shared"
MOBILE_SHARED_DIR="./src/shared"

# Create shared directory in mobile if it doesn't exist
mkdir -p "$MOBILE_SHARED_DIR"

# Create symlink to shared schema
if [ -f "$SHARED_DIR/schema.ts" ]; then
  ln -sf "../../shared/schema.ts" "$MOBILE_SHARED_DIR/schema.ts"
  echo "✓ Linked shared/schema.ts"
else
  echo "⚠ Warning: ../shared/schema.ts not found"
fi

echo "Done! Shared types are now available in src/shared/"
