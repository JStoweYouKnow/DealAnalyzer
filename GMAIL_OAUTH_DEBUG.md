# Gmail OAuth Debugging Guide

## Current Issue
User reports "still getting the same error" with Gmail authorization.

## What to Check

### 1. Check Backend Logs
Look for these log messages in your Vercel deployment logs:

**When requesting auth URL:**
- `[Gmail Auth URL] Generated OAuth URL` - Should show userId and redirectUri
- Check if `userId` is present and `state` is being generated

**When callback is received:**
- `[Gmail Callback] Processing OAuth callback` - Should show hasCode, hasState, hasUserId
- `[Gmail Callback] Successfully exchanged code for tokens` - Should show token details
- `[Gmail Callback] Cookie verification` - Should show tokens were stored
- `[Gmail Callback] ✅ Success` or `⚠️ WARNING` messages

**When checking status:**
- `[Gmail Status Check]` - Should show isConnected, tokenSource, userId

### 2. Common Issues

#### Issue: "No userId available"
**Symptoms:**
- Log shows `userId: 'MISSING'` in callback
- Tokens stored in cookie but not in database
- Status check returns `connected: false`

**Fix:**
- Ensure mobile app is sending Bearer token in `/gmail-auth-url` request
- Check that state parameter is being generated with userId
- Verify state is being decoded correctly in callback

#### Issue: "No refresh token"
**Symptoms:**
- Log shows `hasRefreshToken: false`
- Tokens expire quickly
- Need to re-authorize frequently

**Fix:**
- Google only returns refresh token on first authorization
- If re-authorizing, check if existing refresh token is preserved
- Ensure `access_type: 'offline'` is set in OAuth config

#### Issue: "Tokens not found in status check"
**Symptoms:**
- Callback succeeds but status check returns `connected: false`
- Cookie exists but status check doesn't find it

**Fix:**
- Check cookie domain/path settings
- Verify userId matches between callback and status check
- Check if tokens are in database vs cookie only

### 3. Test the Flow Manually

1. **Get Auth URL:**
   ```bash
   curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
     https://comfort-finder-analyzer.vercel.app/api/gmail-auth-url
   ```
   - Should return `authUrl` with `state` parameter
   - Decode state: `echo "STATE_VALUE" | base64 -d`

2. **Complete OAuth:**
   - Open authUrl in browser
   - Authorize with Google
   - Should redirect to callback with `code` and `state`

3. **Check Status:**
   ```bash
   curl -H "Authorization: Bearer YOUR_CLERK_TOKEN" \
     https://comfort-finder-analyzer.vercel.app/api/gmail-status
   ```
   - Should return `connected: true` after callback

### 4. Verify Configuration

**Google Cloud Console:**
- Redirect URI: `https://comfort-finder-analyzer.vercel.app/api/gmail-callback`
- OAuth client ID and secret are correct
- Gmail API is enabled

**Environment Variables:**
- `GMAIL_CLIENT_ID` - OAuth client ID
- `GMAIL_CLIENT_SECRET` - OAuth client secret
- `GMAIL_REDIRECT_URI` - Should match Google Console (optional, auto-detected)
- `NEXT_PUBLIC_CONVEX_URL` - For token persistence

**Mobile App:**
- Sending Bearer token in `/gmail-auth-url` request
- Using correct API base URL
- Deep link scheme configured: `dealanalyzer://`

### 5. Debug Steps

1. **Check if state parameter is working:**
   - Look at auth URL - should contain `state=` parameter
   - Check callback logs - should extract userId from state
   - If state is missing, userId won't be available

2. **Check token exchange:**
   - Look for `Successfully exchanged code for tokens` log
   - If missing, check `getTokens` function error
   - Verify Gmail API credentials are correct

3. **Check token storage:**
   - Cookie should be set with `gmailTokens`
   - If userId available, tokens should be in database
   - Check `Cookie verification` log for details

4. **Check status retrieval:**
   - Status check should find tokens in cookie or database
   - Verify userId matches between requests
   - Check `tokenSource` in logs

### 6. Quick Fixes

**If userId is missing:**
- Ensure mobile app includes Bearer token in auth URL request
- Check that state parameter encoding/decoding works
- Verify Clerk token is valid

**If tokens aren't persisting:**
- Check Convex database connection
- Verify `NEXT_PUBLIC_CONVEX_URL` is set
- Check database schema for `userOAuthTokens` table

**If status check fails:**
- Verify cookie is being set correctly
- Check cookie domain/path matches
- Ensure userId is consistent across requests

## Next Steps

1. Check Vercel deployment logs for the specific error messages
2. Share the error message or log output
3. Test the flow step by step using the manual test commands above


