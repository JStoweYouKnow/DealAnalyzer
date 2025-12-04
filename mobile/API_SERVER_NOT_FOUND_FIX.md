# API Server Not Found Error - Fix Guide

## Problem

The mobile app is showing "server can't be found" error when trying to connect to the API.

## Root Causes

1. **API URL not configured** - The app falls back to `localhost:3002` which doesn't work on physical devices
2. **Expo Go doesn't use EAS environment variables** - Environment variables from `eas.json` are only available in EAS builds, not Expo Go
3. **Network connectivity** - Device can't reach the API server

## Solutions

### Solution 1: Add API URL to app.json (✅ Already Done)

The API URL has been added to `app.json`:
```json
{
  "extra": {
    "apiUrl": "https://comfortfinder.projcomfort.com"
  }
}
```

### Solution 2: Add to .env.local for Expo Go

If you're using Expo Go, create or update `.env.local`:

```bash
# In mobile/.env.local
EXPO_PUBLIC_API_URL=https://comfortfinder.projcomfort.com
```

Then restart the Expo server:
```bash
cd mobile
npx expo start --clear
```

### Solution 3: Verify API Server is Running

Check if the API server is accessible:

```bash
# Test from terminal
curl https://comfortfinder.projcomfort.com/api/health

# Or test from browser
open https://comfortfinder.projcomfort.com/api/health
```

### Solution 4: Check Network Configuration

If using a physical device:

1. **Ensure device and computer are on same network** (for localhost)
2. **Use production URL** instead of localhost for physical devices
3. **Check firewall settings** - may be blocking connections

## Configuration Priority

The API URL is resolved in this order:

1. `process.env.EXPO_PUBLIC_API_URL` (from `.env.local` or EAS secrets)
2. `Constants.expoConfig?.extra?.apiUrl` (from `app.json`)
3. Localhost fallback (development only)

## Debugging

The updated code now logs detailed information:

```
[API Config] Checking API URL configuration: {...}
[API Config] ✅ Using configured API URL: https://comfortfinder.projcomfort.com
```

If you see errors like:
```
[API Error] ❌ Server not found or connection refused
[API Error] Base URL: http://localhost:3002
```

This means the API URL is not being loaded correctly.

## Quick Fix

1. **For Expo Go**: Add to `.env.local`:
   ```bash
   EXPO_PUBLIC_API_URL=https://comfortfinder.projcomfort.com
   ```

2. **Restart Expo**:
   ```bash
   cd mobile
   npx expo start --clear
   ```

3. **For EAS Builds**: The API URL is already configured in `eas.json` for production/preview builds

## Verification

After fixing, check the logs for:
```
[API Config] ✅ Using configured API URL: https://comfortfinder.projcomfort.com
```

If you still see localhost, the configuration isn't being loaded.

