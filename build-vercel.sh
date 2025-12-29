#!/bin/bash
set -e

# Build packages in dependency order
cd packages/types && pnpm build
cd ../utils && pnpm build
cd ../ui && pnpm build
cd ../external-apis && pnpm build
cd ../storage && pnpm build
cd ../ai-services && pnpm build
cd ../analysis-engine && pnpm build

# Build Next.js app
cd ../../apps/web && pnpm next build
