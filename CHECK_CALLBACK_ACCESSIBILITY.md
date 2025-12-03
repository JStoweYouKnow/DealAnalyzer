# Check Gmail Callback Accessibility

## Current Issue
The redirect URI in the auth URL is: `https://comfortfinder.projcomfort.com/api/gmail-callback`

But the callback might not be accessible or receiving requests.

## Steps to Verify

### 1. Test if Callback Route is Accessible
Open in browser or use curl:
```bash
curl https://comfortfinder.projcomfort.com/api/gmail-callback?code=test&state=test
```

Expected response:
- Should return an error about invalid code (that's OK - means route is accessible)
- If you get 404 or connection error, the route is not accessible

### 2. Verify Google Cloud Console Configuration
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Check "Authorized redirect URIs"
5. **Must include exactly**: `https://comfortfinder.projcomfort.com/api/gmail-callback`

### 3. Check Server Logs
When you complete OAuth, check your server logs for:
```
[Gmail Callback] ========== CALLBACK RECEIVED ==========
```

If you don't see this, the callback is not reaching your server.

### 4. Verify Domain Accessibility
Test if the domain is accessible:
```bash
curl -I https://comfortfinder.projcomfort.com/api/gmail-callback
```

Should return HTTP status (200, 400, 500, etc. - any status means it's accessible)

## Common Issues

### Issue 1: Domain Not Configured in Google Cloud Console
**Fix**: Add `https://comfortfinder.projcomfort.com/api/gmail-callback` to Authorized redirect URIs

### Issue 2: Callback Route Not Deployed
**Fix**: Ensure the Next.js app is deployed and the `/api/gmail-callback` route exists

### Issue 3: HTTPS/HTTP Mismatch
**Fix**: Ensure both use HTTPS (or both use HTTP in dev)

### Issue 4: Domain Not Resolving
**Fix**: Check DNS configuration for `comfortfinder.projcomfort.com`

## Next Steps
1. Test callback accessibility (step 1)
2. Verify Google Cloud Console (step 2)
3. Check server logs (step 3)
4. Report findings

