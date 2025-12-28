# 🔄 How to Update EAS Secret for Clerk Production Key

## Current Status

✅ **eas.json** - Production key configured:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k
```

✅ **EAS Secret** - Exists but may need updating:
- Name: `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
- ID: `5066a5df-aa48-404d-82ac-e9797fbe7dcf`
- Last Updated: Nov 30 23:09:02

## Option 1: Update via EAS Web Dashboard (Recommended)

1. Go to https://expo.dev
2. Navigate to your project: `@pjcdev/deal-analyzer-mobile`
3. Go to **Settings** → **Environment Variables**
4. Find `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
5. Click **Edit** and update the value to:
   ```
   pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k
   ```
6. Save

## Option 2: Update via Command Line

### Delete and Recreate (if update doesn't work):

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile

# Delete the existing secret
eas env:delete EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project

# Create new one with production key
eas env:create \
  --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY \
  --value "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k" \
  --scope project \
  --type string
```

### Or use interactive mode:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas env:update EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
# Follow the prompts to enter the new value
```

## Option 3: Use eas.json (Already Configured)

The production key is already in `eas.json`:
```json
"production": {
  "env": {
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k"
  }
}
```

**This will work for builds!** EAS will use the value from `eas.json` if no secret exists, or the secret will override it if it exists.

## Verification

After updating, verify with:
```bash
eas env:get EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --scope project
```

Or check in the EAS dashboard.

## Important Notes

1. **EAS Secrets take precedence** over `eas.json` env values
2. If the secret exists, it will override the `eas.json` value
3. If you want to use the `eas.json` value, you can delete the EAS secret
4. The current `eas.json` configuration will work for production builds

## Current Production Key

```
pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k
```

---

**Status**: ✅ Production key configured in `eas.json` - ready for builds!

