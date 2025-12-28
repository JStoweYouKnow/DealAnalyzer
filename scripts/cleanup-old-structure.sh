#!/bin/bash

# Cleanup Old Structure Script
# This script removes old directories that have been migrated to the monorepo structure
# Run with --dry-run first to see what would be removed

set -e

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo "🔍 DRY RUN MODE - No files will be deleted"
    echo ""
fi

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

REMOVED=0
SKIPPED=0

# Function to remove directory if it exists
remove_dir() {
    local dir=$1
    local reason=$2
    
    if [ -d "$dir" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}Would remove:${NC} $dir ($reason)"
        else
            echo -e "${GREEN}Removing:${NC} $dir ($reason)"
            rm -rf "$dir"
            REMOVED=$((REMOVED + 1))
        fi
    else
        if [ "$DRY_RUN" = false ]; then
            echo -e "${YELLOW}Skipped (not found):${NC} $dir"
            SKIPPED=$((SKIPPED + 1))
        fi
    fi
}

# Function to remove file if it exists
remove_file() {
    local file=$1
    local reason=$2
    
    if [ -f "$file" ]; then
        if [ "$DRY_RUN" = true ]; then
            echo -e "${YELLOW}Would remove:${NC} $file ($reason)"
        else
            echo -e "${GREEN}Removing:${NC} $file ($reason)"
            rm -f "$file"
            REMOVED=$((REMOVED + 1))
        fi
    else
        if [ "$DRY_RUN" = false ]; then
            echo -e "${YELLOW}Skipped (not found):${NC} $file"
            SKIPPED=$((SKIPPED + 1))
        fi
    fi
}

echo "🧹 Cleaning up old monorepo structure..."
echo ""

# Old directories that have been migrated
echo "📁 Removing old directories..."
remove_dir "lib" "Moved to packages/utils/"
remove_dir "shared" "Moved to packages/types/"
remove_dir "server/services" "Services moved to packages/external-apis/ or apps/api/src/services/"

# Old app directories (if they exist as duplicates)
if [ -d "app" ] && [ -d "apps/web" ]; then
    echo -e "${YELLOW}⚠️  Found both 'app' and 'apps/web' - 'app' may be old${NC}"
    echo "   Review manually before removing"
fi

if [ -d "app 2" ] && [ -d "apps/web" ]; then
    remove_dir "app 2" "Duplicate of apps/web"
fi

if [ -d "client" ] && [ -d "apps/web" ]; then
    echo -e "${YELLOW}⚠️  Found 'client' directory - review manually${NC}"
fi

if [ -d "client 2" ] && [ -d "apps/web" ]; then
    remove_dir "client 2" "Duplicate directory"
fi

# Old package.json at root if it's not the monorepo root
if [ -f "package.json" ]; then
    if grep -q "dealanalyzer-monorepo" package.json 2>/dev/null; then
        echo -e "${GREEN}✅ Root package.json is correct (monorepo root)${NC}"
    else
        echo -e "${YELLOW}⚠️  Root package.json may need review${NC}"
    fi
fi

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ "$DRY_RUN" = true ]; then
    echo -e "${YELLOW}Dry run complete. Run without --dry-run to actually remove files.${NC}"
else
    echo -e "${GREEN}✅ Cleanup complete!${NC}"
    echo "   Removed: $REMOVED items"
    echo "   Skipped: $SKIPPED items"
    echo ""
    echo "⚠️  Note: Some directories may still exist if they contain code not yet migrated."
    echo "   Review the MONOREPO_MIGRATION.md file for details."
fi


