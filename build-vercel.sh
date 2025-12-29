#!/bin/bash
set -e

# Ensure workspace is properly linked
pnpm install --offline

# Build packages in dependency order by running build from each package directory
(cd packages/types && pnpm build)
(cd packages/utils && pnpm build)
(cd packages/ui && pnpm build)
(cd packages/external-apis && pnpm build)
(cd packages/storage && pnpm build)
(cd packages/ai-services && pnpm build)
(cd packages/analysis-engine && pnpm build)

# Build Next.js app
(cd apps/web && pnpm build)
