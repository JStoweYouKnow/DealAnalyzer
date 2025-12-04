# API URL Troubleshooting

## Current Issue

The domain `comfortfinder.projcomfort.com` cannot be resolved, causing "server can't be found" errors.

## Problem Diagnosis

The error shows:
```
[API Error] ❌ Server not found or connection refused
[API Error] Base URL: https://comfortfinder.projcomfort.com
[API Error] Error code: ERR_NETWORK
```

This means:
1. **Domain doesn't exist** - `comfortfinder.projcomfort.com` may not be configured
2. **DNS not resolving** - The domain might not be set up in DNS
3. **Server not deployed** - The API server might not be running at this domain

## Solutions

### Option 1: Use Local Development Server

If you're developing locally, use your local server:

1. **Start the Next.js server**:
   ```bash
   cd /Users/v/Downloads/DealAnalyzer
   npm run dev:next
   ```

2. **Update `.env.local`**:
   ```bash
   # For physical device, use your computer's IP address
   EXPO_PUBLIC_API_URL=http://192.168.1.XXX:3002
   
   # Or if using simulator, use localhost
   EXPO_PUBLIC_API_URL=http://localhost:3002
   ```

3. **Find your local IP**:
   ```bash
   # macOS
   ipconfig getifaddr en0
   
   # Or check network settings
   ifconfig | grep "inet " | grep -v 127.0.0.1
   ```

### Option 2: Deploy to Vercel

If you need a production URL:

1. **Deploy to Vercel**:
   ```bash
   npm install -g vercel
   vercel --prod
   ```

2. **Get your Vercel URL** (e.g., `your-app.vercel.app`)

3. **Update `.env.local`**:
   ```bash
   EXPO_PUBLIC_API_URL=https://your-app.vercel.app
   ```

### Option 3: Configure Custom Domain

If `comfortfinder.projcomfort.com` should work:

1. **Check DNS configuration**:
   ```bash
   nslookup comfortfinder.projcomfort.com
   dig comfortfinder.projcomfort.com
   ```

2. **Verify domain is pointing to your server**

3. **Check if server is running** on that domain

## Quick Fix for Development

For immediate testing, update `.env.local`:

```bash
# Option A: Use localhost (simulator only)
EXPO_PUBLIC_API_URL=http://localhost:3002

# Option B: Use your computer's IP (physical device)
EXPO_PUBLIC_API_URL=http://192.168.1.100:3002

# Option C: Use Vercel deployment (if deployed)
EXPO_PUBLIC_API_URL=https://your-app.vercel.app
```

Then restart Expo:
```bash
cd mobile
npx expo start --clear
```

## Verify API is Accessible

Test the API URL:
```bash
# Test from terminal
curl https://your-api-url.com/api/health

# Or test in browser
open https://your-api-url.com/api/health
```

## Current Configuration

- **app.json**: `https://comfortfinder.projcomfort.com` (may not be accessible)
- **eas.json**: `https://comfortfinder.projcomfort.com` (for production builds)
- **.env.local**: `https://comfortfinder.projcomfort.com` (for Expo Go)

## Next Steps

1. **Determine your actual API URL**:
   - Is the server running locally? → Use local IP
   - Is it deployed to Vercel? → Use Vercel URL
   - Is it on a custom domain? → Verify DNS

2. **Update all configurations** with the correct URL

3. **Restart Expo server** to pick up changes

