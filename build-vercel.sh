#!/bin/bash
set -e

# Add node_modules/.bin to PATH so tsc can be found
export PATH="./node_modules/.bin:$PATH"

# Build packages using TypeScript build mode with --force
# This ensures clean builds and properly handles project references
tsc -b packages/types --force
tsc -b packages/utils --force
tsc -b packages/ui --force
tsc -b packages/external-apis --force
tsc -b packages/storage --force
tsc -b packages/ai-services --force
tsc -b packages/analysis-engine --force

# Build Next.js app
(cd apps/web && pnpm build)
