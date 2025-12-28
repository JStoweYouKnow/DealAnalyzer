# 🔧 Correct EAS Environment Variable Commands

## Issue with Previous Commands

The error occurred because `eas env:delete` requires an **environment** parameter (production, preview, or development) as the first argument.

## ✅ Correct Command Syntax

### Delete Environment Variable

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile

# Delete from production environment
eas env:delete production --variable-name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project

# Or delete from all environments (if it exists in multiple)
eas env:delete production --variable-name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project
eas env:delete preview --variable-name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project
eas env:delete development --variable-name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project
```

### Create Environment Variable

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile

# Create for production environment
eas env:create \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --value "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k" \
  --environment production \
  --scope project
```

## 📝 Step-by-Step Instructions

1. **Delete existing variable** (if needed):
   ```bash
   eas env:delete production --variable-name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project
   ```

2. **Create new variable with production key**:
   ```bash
   eas env:create \
     --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
     --value "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k" \
     --environment production \
     --scope project
   ```

3. **Verify**:
   ```bash
   eas env:list --scope project --environment production
   ```

## ⚠️ Important Notes

- The `--environment` flag specifies which build environment (production, preview, development)
- The `--scope project` means it's scoped to this project
- If the command prompts for visibility, choose "Secret" for sensitive keys
- The `eas.json` file already has the correct value, so builds will work regardless

## ✅ Current Status

Your `eas.json` already has the production key configured:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k"
  }
}
```

**This means your production builds will work correctly!** The EAS secret update is optional but recommended for consistency.

## 🌐 Alternative: Use Web Dashboard

If commands still have issues, use the EAS web dashboard:
1. Go to https://expo.dev
2. Your project → Settings → Environment Variables
3. Update or create the variable there

---

**Production Key**: `pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k`

