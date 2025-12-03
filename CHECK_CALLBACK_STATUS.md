# How to Verify Gmail Callback is Working

## Current Status
- ✅ OAuth URL is being generated correctly
- ✅ Redirect URI: `https://comfortfinder.projcomfort.com/api/gmail-callback`
- ✅ Mobile app is opening the browser
- ⏳ Need to verify callback is received

## Step-by-Step Verification

### Step 1: Complete OAuth Flow
1. In the mobile app, tap "Connect Gmail Account"
2. Browser opens with Google OAuth
3. Select your Google account
4. Grant permissions
5. **Watch what happens next**

### Step 2: Check What Happens After OAuth

#### Option A: Browser Shows Success Page
If you see "Gmail Connected Successfully!" page:
- ✅ Callback was received by server
- ✅ Tokens were stored
- The page should redirect back to the app

#### Option B: Browser Shows Error
If you see an error page:
- Check the error message
- Look for "redirect_uri_mismatch" (means Google Cloud Console config issue)
- Look for other OAuth errors

#### Option C: Browser Stays on Google Page
If nothing happens:
- Callback might not be reaching server
- Check server logs (Step 3)

### Step 3: Check Server Logs

After completing OAuth, check your server logs for:

```
═══════════════════════════════════════════════════════════
[Gmail Callback] ========== CALLBACK RECEIVED ==========
[Gmail Callback] Timestamp: 2024-...
[Gmail Callback] Request URL: https://comfortfinder.projcomfort.com/api/gmail-callback?code=...
═══════════════════════════════════════════════════════════
```

**If you see this log:**
- ✅ Callback is reaching your server
- Check for any errors after this log
- Look for: `[Gmail Callback] ✅ SUCCESS - Tokens stored and ready`

**If you DON'T see this log:**
- ❌ Callback is NOT reaching your server
- Possible causes:
  - Domain not resolving correctly
  - Firewall blocking the request
  - Server not accessible at that URL
  - Redirect URI mismatch (even if it's in Google Cloud Console)

### Step 4: Check Mobile App Status

After returning to the app:
1. The app should automatically check Gmail status
2. Look for logs like: `[Gmail Status] Screen focused, refetching status...`
3. Check if connection status updates to "connected"

## Troubleshooting

### Issue: No Callback Log in Server
**Possible causes:**
1. **Domain not accessible** - Test: `curl https://comfortfinder.projcomfort.com/api/gmail-callback?code=test`
2. **Redirect URI mismatch** - Verify exact match in Google Cloud Console
3. **Server not running** - Check server is up and accessible

### Issue: Callback Received But Fails
**Check logs for:**
- `[Gmail Callback] Error exchanging code for tokens` - Token exchange failed
- `[Gmail Callback] No tokens received` - Google didn't return tokens
- Any other error messages

### Issue: Callback Works But App Doesn't Update
**Check:**
- App state listeners are working
- Deep link is being received
- Status refetch is happening

## Quick Test

1. Complete OAuth flow
2. Immediately check server logs
3. Report:
   - Do you see the callback log?
   - What does the browser show?
   - Any errors?

