#!/bin/bash
set -e

# Build packages in dependency order using pnpm from root
pnpm --filter @dealanalyzer/types build
pnpm --filter @dealanalyzer/utils build
pnpm --filter @dealanalyzer/ui build
pnpm --filter @dealanalyzer/external-apis build
pnpm --filter @dealanalyzer/storage build
pnpm --filter @dealanalyzer/ai-services build
pnpm --filter @dealanalyzer/analysis-engine build

# Build Next.js app
pnpm --filter web build
