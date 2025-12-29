#!/bin/bash
set -e

# Build packages using TypeScript project references
# This handles dependencies automatically
pnpm tsc -b packages/types
pnpm tsc -b packages/utils
pnpm tsc -b packages/ui
pnpm tsc -b packages/external-apis
pnpm tsc -b packages/storage
pnpm tsc -b packages/ai-services
pnpm tsc -b packages/analysis-engine

# Build Next.js app
pnpm --filter web build
