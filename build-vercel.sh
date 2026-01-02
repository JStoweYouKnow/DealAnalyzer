#!/bin/bash
set -e

# Add node_modules/.bin to PATH so tsc can be found
export PATH="./node_modules/.bin:$PATH"

# Build packages in dependency order
# Each package uses "tsc" which outputs to dist/
echo "Building packages..."

# Types has no dependencies
(cd packages/types && pnpm build)

# Utils depends on types
(cd packages/utils && pnpm build)

# UI depends on types (component library)
(cd packages/ui && pnpm build)

# External-apis depends on types and utils
(cd packages/external-apis && pnpm build)

# Storage depends on types and utils
(cd packages/storage && pnpm build)

# AI-services depends on types and utils
(cd packages/ai-services && pnpm build)

# Analysis-engine depends on types and utils
(cd packages/analysis-engine && pnpm build)

echo "All packages built successfully"

# Build Next.js app
echo "Building Next.js app..."
(cd apps/web && pnpm build)
