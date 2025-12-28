# DealAnalyzer Monorepo

This project has been migrated to a monorepo structure using [Turbo](https://turbo.build/) and [pnpm](https://pnpm.io/).

## Quick Start

### Prerequisites
- Node.js >= 20.0.0
- pnpm >= 9.0.0

### Installation
```bash
# Install pnpm if you haven't already
npm install -g pnpm@9.0.0

# Install all dependencies
pnpm install
```

### Development
```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev:web      # Next.js web app (port 3002)
pnpm dev:api      # Express API server
pnpm dev:mobile   # React Native mobile app
```

### Building
```bash
# Build all packages and apps
pnpm build

# Build specific app
pnpm build:web
pnpm build:api
pnpm build:mobile

# Build only packages (faster for package development)
pnpm build:packages
```

### Testing
```bash
# Run all tests
pnpm test

# Run type checking
pnpm type-check

# Run linting
pnpm lint
```

## Project Structure

```
.
├── apps/              # Applications
│   ├── web/          # Next.js web application
│   ├── api/          # Express API server
│   ├── mobile/       # React Native mobile app
│   └── convex/       # Convex backend
├── packages/          # Shared packages
│   ├── types/        # TypeScript types and Zod schemas
│   ├── utils/         # Utility functions
│   ├── external-apis/ # External API integrations
│   ├── ai-services/  # AI analysis services
│   ├── analysis-engine/ # Property analysis engine
│   ├── storage/      # Storage abstractions
│   ├── ui/           # Shared UI components
│   └── config/       # Shared configuration
└── scripts/          # Utility scripts
```

## Package Usage

All packages are available via workspace protocol:

```typescript
// Import from packages
import { FundingSource } from "@dealanalyzer/types";
import { logger } from "@dealanalyzer/utils";
import { geocodingService } from "@dealanalyzer/external-apis";
import { Button } from "@dealanalyzer/ui";
```

## Turbo

This monorepo uses Turbo for:
- **Parallel execution** - Run tasks across packages in parallel
- **Caching** - Skip unchanged packages/apps
- **Incremental builds** - Only rebuild what changed
- **Task dependencies** - Automatically determine build order

### Turbo Commands
```bash
# Run a task across all packages/apps
pnpm turbo run build

# Run a task for a specific package/app
pnpm turbo run build --filter=web

# Run a task for packages only
pnpm turbo run build --filter='./packages/*'

# Force a rebuild (ignore cache)
pnpm turbo run build --force
```

## CI/CD

The GitHub Actions workflow automatically:
1. Installs dependencies with pnpm
2. Runs linting and type checking
3. Runs tests
4. Builds packages, then apps
5. Runs security audit
6. Deploys preview builds (on PRs)

## Migration Status

✅ **Complete** - All phases of the monorepo migration have been completed:
- Phase 1: Monorepo structure setup
- Phase 2: Package configuration
- Phase 3: Code migration
- Phase 4: Import updates
- Phase 5: Build pipeline configuration
- Phase 6: CI/CD updates
- Phase 7: Comprehensive testing
- Phase 8: Cleanup

See [MONOREPO_MIGRATION.md](./MONOREPO_MIGRATION.md) for detailed migration documentation.

## Verification

Run the verification script to check that everything is set up correctly:

```bash
./scripts/verify-monorepo.sh
```

## Cleanup

To remove old directories that have been migrated:

```bash
# Dry run (see what would be removed)
./scripts/cleanup-old-structure.sh --dry-run

# Actually remove old directories
./scripts/cleanup-old-structure.sh
```

## Troubleshooting

### Build Issues
- Ensure packages are built first: `pnpm build:packages`
- Clear Turbo cache: `pnpm turbo clean`
- Reinstall dependencies: `rm -rf node_modules && pnpm install`

### Import Errors
- Verify package is in app's `package.json` dependencies
- Check that package exports the symbol: `packages/[package]/src/index.ts`
- Ensure package is built: `pnpm build:packages`

### Type Errors
- Run type check: `pnpm type-check`
- Check TypeScript config: `tsconfig.json` in each package/app

## Contributing

When adding new code:
1. **Shared code** → Add to appropriate package in `packages/`
2. **App-specific code** → Add to `apps/[app]/`
3. **New package** → Create in `packages/` and add to `pnpm-workspace.yaml`
4. **Update imports** → Use `@dealanalyzer/*` package names

## Resources

- [Turbo Documentation](https://turbo.build/repo/docs)
- [pnpm Documentation](https://pnpm.io/)
- [Monorepo Migration Guide](./MONOREPO_MIGRATION.md)


