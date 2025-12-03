# Gmail OAuth Callback Debugging Guide

## Problem
The server is not receiving the completed OAuth callback from Google.

## Root Cause Analysis

### Two Different Callback Routes
1. **Express Server Route** (`server/routes.ts`): `/api/gmail-callback`
   - Uses `process.env.GMAIL_REDIRECT_URI`
   - Stores tokens in session
   - Used by Express server at `https://api.comfortfinder.com`

2. **Next.js API Route** (`app/api/gmail-callback/route.ts`): `/api/gmail-callback`
   - Dynamically determines redirect URI from request
   - Stores tokens in cookies and database
   - Used by Next.js app

### The Issue
- Mobile app calls `/api/gmail-auth-url` which could hit either:
  - Express server: `https://api.comfortfinder.com/api/gmail-auth-url`
  - Next.js API: `https://api.comfortfinder.com/api/gmail-auth-url`
- The auth URL generated must use a redirect URI that matches what's configured in Google Cloud Console
- The callback must be received by the same server that generated the auth URL

## Solution

### Step 1: Check Which Server is Handling Requests
Check your server logs when the mobile app calls `/api/gmail-auth-url`:
- If you see logs from `server/routes.ts` → Express server is handling it
- If you see logs from `app/api/gmail-auth-url/route.ts` → Next.js is handling it

### Step 2: Verify Redirect URI Configuration
The redirect URI in the auth URL must exactly match:
1. What's configured in Google Cloud Console
2. What the callback route expects

**For Express Server:**
- Uses `process.env.GMAIL_REDIRECT_URI`
- Should be: `https://api.comfortfinder.com/api/gmail-callback`

**For Next.js API:**
- Dynamically determined from request
- Should be: `https://api.comfortfinder.com/api/gmail-callback`

### Step 3: Check Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Check "Authorized redirect URIs"
5. Ensure it includes: `https://api.comfortfinder.com/api/gmail-callback`

### Step 4: Verify Environment Variables
Check your production environment has:
```bash
GMAIL_CLIENT_ID=your-client-id
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REDIRECT_URI=https://api.comfortfinder.com/api/gmail-callback  # If using Express
```

### Step 5: Check Server Logs
The callback route now has extensive logging. When Google redirects back, you should see:
```
[Gmail Callback] ========== CALLBACK RECEIVED ==========
[Gmail Callback] Request URL: ...
[Gmail Callback] Query parameters: ...
```

If you don't see these logs, the callback is not reaching your server.

## Common Issues

### Issue 1: Redirect URI Mismatch
**Symptom:** Google shows "redirect_uri_mismatch" error
**Fix:** Ensure the redirect URI in the auth URL exactly matches Google Cloud Console

### Issue 2: Callback Not Reaching Server
**Symptom:** No logs from callback route
**Possible Causes:**
- Firewall blocking the request
- Wrong domain in Google Cloud Console
- HTTPS/HTTP mismatch
- Server not running or not accessible

### Issue 3: Wrong Server Handling Callback
**Symptom:** Callback reaches wrong route (Express vs Next.js)
**Fix:** Ensure consistent routing - if auth URL comes from Express, callback should go to Express

## Testing

### Test 1: Check Auth URL Generation
```bash
# From mobile app, check the generated auth URL
# It should contain: redirect_uri=https://api.comfortfinder.com/api/gmail-callback
```

### Test 2: Check Callback Reception
1. Complete OAuth flow
2. Check server logs for `[Gmail Callback] ========== CALLBACK RECEIVED ==========`
3. If not present, callback is not reaching server

### Test 3: Manual Callback Test
```bash
# Test if callback route is accessible
curl https://api.comfortfinder.com/api/gmail-callback?code=test&state=test
# Should return error about invalid code, but route should be accessible
```

## Next Steps
1. Check server logs when OAuth completes
2. Verify redirect URI in Google Cloud Console
3. Ensure environment variables are set correctly
4. Test callback route accessibility

