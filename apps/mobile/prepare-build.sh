#!/bin/bash
# Quick script to prepare app for building

echo "🚀 Preparing app for EAS build..."
echo ""

# Step 1: Configure EAS project
echo "Step 1: Configuring EAS project..."
echo "This will create/link an EAS project and update app.json"
echo ""
read -p "Press Enter to run 'eas build:configure' (or Ctrl+C to cancel)..."
eas build:configure

echo ""
echo "✅ Configuration complete!"
echo ""
echo "Next steps:"
echo "1. Update production environment variables in eas.json (or use EAS secrets)"
echo "2. Test with: eas build --platform ios --profile development"
echo "3. Production build: eas build --platform ios --profile production"
echo ""
echo "See PREPARE_FOR_BUILD.md for detailed instructions"
