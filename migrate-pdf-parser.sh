#!/bin/bash

# PDF Parser Migration Script
# Switches from pdfjs-dist to pdf-parse (no workers required)

set -e  # Exit on any error

echo "🔄 PDF Parser Migration Script"
echo "================================"
echo ""

# Check if pdf-parse is already installed
if ! npm list pdf-parse > /dev/null 2>&1; then
  echo "📦 Installing pdf-parse..."
  npm install pdf-parse --legacy-peer-deps
  echo "✅ pdf-parse installed"
else
  echo "✅ pdf-parse is already installed"
fi

echo ""

# Backup current extractor if it exists
if [ -f "app/lib/pdf-extractor.ts" ]; then
  echo "💾 Backing up current pdf-extractor.ts..."
  cp app/lib/pdf-extractor.ts app/lib/pdf-extractor.backup.ts
  echo "✅ Backup created: app/lib/pdf-extractor.backup.ts"
else
  echo "ℹ️  No existing pdf-extractor.ts found"
fi

echo ""

# Check if the simple extractor exists
if [ -f "app/lib/pdf-extractor-simple.ts" ]; then
  echo "🔧 Switching to pdf-parse implementation..."
  cp app/lib/pdf-extractor-simple.ts app/lib/pdf-extractor.ts
  echo "✅ pdf-extractor.ts updated with pdf-parse implementation"
else
  echo "❌ Error: app/lib/pdf-extractor-simple.ts not found"
  echo "   Please ensure the file exists before running this script"
  exit 1
fi

echo ""
echo "✨ Migration complete!"
echo ""
echo "Next steps:"
echo "  1. Test PDF uploads: npm run dev:next"
echo "  2. Upload a PDF file in the analyzer"
echo "  3. Verify text extraction works correctly"
echo ""
echo "Optional cleanup (after testing):"
echo "  npm uninstall pdfjs-dist @types/pdfjs-dist"
echo ""
echo "Rollback instructions:"
echo "  cp app/lib/pdf-extractor.backup.ts app/lib/pdf-extractor.ts"
echo "  npm install pdfjs-dist @types/pdfjs-dist"
