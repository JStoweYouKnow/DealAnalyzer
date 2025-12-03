# Verify Gmail Callback is Being Called

## Step 1: Test if Callback Route is Accessible

### Test 1: Simple Test Endpoint
Open in browser or use curl:
```bash
curl https://comfortfinder.projcomfort.com/api/gmail-callback/test
```

Expected response:
```json
{
  "success": true,
  "message": "Gmail callback route is accessible!",
  "expectedCallbackUrl": "https://comfortfinder.projcomfort.com/api/gmail-callback"
}
```

If this works, the route is accessible.

### Test 2: Test Callback Route Directly
```bash
curl "https://comfortfinder.projcomfort.com/api/gmail-callback?code=test123&state=test456"
```

Expected: Should return an error about invalid code (that's OK - means route is accessible and processing the request)

## Step 2: Monitor Server Logs

When you complete OAuth, you should see in your server logs:
```
═══════════════════════════════════════════════════════════
[Gmail Callback] ========== CALLBACK RECEIVED ==========
[Gmail Callback] Timestamp: 2024-...
[Gmail Callback] Request URL: https://comfortfinder.projcomfort.com/api/gmail-callback?code=...
═══════════════════════════════════════════════════════════
```

**If you don't see this log**, the callback is NOT reaching your server.

## Step 3: Check What Happens After OAuth

After completing OAuth in the browser:

1. **Check the browser URL bar** - Does it show:
   - `https://comfortfinder.projcomfort.com/api/gmail-callback?code=...`?
   - Or does it show an error page?
   - Or does it stay on Google's page?

2. **Check server logs** - Do you see the callback received log?

3. **Check browser console** (if you can) - Any JavaScript errors?

## Step 4: Verify Google is Redirecting

The redirect URI in the auth URL must match Google Cloud Console exactly:
- Auth URL shows: `redirect_uri=https://comfortfinder.projcomfort.com/api/gmail-callback`
- Google Cloud Console must have: `https://comfortfinder.projcomfort.com/api/gmail-callback`

## Common Issues

### Issue 1: Callback Not Reaching Server
**Symptoms:**
- No logs in server
- Browser shows error or stays on Google page

**Possible Causes:**
- Domain not resolving correctly
- Firewall blocking the request
- Server not running or not accessible
- HTTPS certificate issues

**Fix:**
1. Test the test endpoint (Step 1, Test 1)
2. Check DNS resolution: `nslookup comfortfinder.projcomfort.com`
3. Check server is running and accessible

### Issue 2: Redirect URI Mismatch
**Symptoms:**
- Google shows "redirect_uri_mismatch" error
- Browser shows error page from Google

**Fix:**
1. Verify redirect URI in Google Cloud Console matches exactly
2. Check for trailing slashes, http vs https, etc.

### Issue 3: Callback Reaches Server But Fails
**Symptoms:**
- You see the callback log
- But then see an error

**Fix:**
- Check the error in server logs
- Common issues: missing env vars, invalid code, etc.

## Next Steps

1. Run Test 1 to verify route is accessible
2. Complete OAuth flow
3. Check server logs for callback received message
4. Report findings

