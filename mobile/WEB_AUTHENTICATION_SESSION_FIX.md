# WebAuthenticationSession Error Fix

## Error Description

```
WebBrowser result: {
  "error": "The operation couldn't be completed. (com.apple.AuthenticationServices.WebAuthenticationSession error 1.)",
  "type": "cancel",
  "url": null
}
```

## Common Causes

### 1. **URL Scheme Not Properly Configured**
- The `dealanalyzer://` scheme must be registered in `app.json`
- ✅ Already configured: `"scheme": "dealanalyzer"`

### 2. **Redirect URI Mismatch**
- The redirect URI in the OAuth URL must match the deep link scheme
- Expected: `dealanalyzer://gmail-callback`
- Check that the server's `/gmail-auth-url` endpoint uses this redirect URI

### 3. **iOS Security Restrictions**
- iOS may block WebAuthenticationSession if:
  - The redirect URI doesn't match exactly
  - The URL scheme isn't properly registered
  - There are security policy violations

### 4. **User Cancellation**
- Error code 1 can also mean the user cancelled
- But it's often a system error when `url` is `null`

## Fixes Applied

### 1. Enhanced Error Handling
- Added detailed logging for WebBrowser results
- Distinguish between user cancellation and system errors
- Provide helpful error messages to users

### 2. WebBrowser Configuration
- Added `maybeCompleteAuthSession()` call
- Configured `showInRecents: true`
- Set `preferEphemeralSession: false` to allow cookies

### 3. Better Diagnostics
- Log platform information
- Log redirect URI from auth URL
- Log full WebBrowser result for debugging

## Verification Steps

1. **Check URL Scheme Registration**
   ```bash
   # Verify in app.json
   grep -A 1 "scheme" mobile/app.json
   # Should show: "scheme": "dealanalyzer"
   ```

2. **Check Server Redirect URI**
   - Verify `/api/gmail-auth-url` returns a URL with:
   - `redirect_uri=https://comfortfinder.projcomfort.com/api/gmail-callback`
   - The server should then redirect to `dealanalyzer://gmail-callback?success=true`

3. **Test Deep Link**
   ```bash
   # On iOS simulator/device
   xcrun simctl openurl booted "dealanalyzer://gmail-callback?success=true"
   ```

4. **Check Associated Domains**
   - Verify `applinks:comfortfinder.projcomfort.com` is configured
   - This is for universal links, not custom URL schemes

## Alternative Solutions

### Option 1: Use Linking.openURL (Fallback)
If WebAuthenticationSession continues to fail, you can use `Linking.openURL` as a fallback:

```typescript
// Try WebBrowser first
try {
  const result = await WebBrowser.openAuthSessionAsync(authUrl, 'dealanalyzer://gmail-callback');
  // Handle result...
} catch (error) {
  // Fallback to Linking
  console.log('[Gmail Connect] Falling back to Linking.openURL...');
  await Linking.openURL(authUrl);
  // User will need to manually return to app
}
```

### Option 2: Use Universal Links
Instead of custom URL scheme, use universal links:
- Configure `applinks:comfortfinder.projcomfort.com` in associated domains
- Use `https://comfortfinder.projcomfort.com/gmail-callback` as redirect URI
- Requires Apple App Site Association file on server

## Debugging

### Enable Verbose Logging
The updated code now logs:
- Platform information
- Redirect URI from auth URL
- Full WebBrowser result
- Error details with stack traces

### Check Console Output
Look for:
```
[Gmail Connect] Opening OAuth session with WebBrowser.openAuthSessionAsync...
[Gmail Connect] Redirect URI: dealanalyzer://gmail-callback
[Gmail Connect] Platform: ios
[Gmail Connect] WebBrowser result: {...}
```

### Common Error Patterns

1. **Error 1 with null URL**: Usually a configuration issue
2. **Error 1 with URL**: User cancellation
3. **No error but type='cancel'**: System blocking the session

## Next Steps

1. Test the updated error handling
2. Check server logs for OAuth callback
3. Verify redirect URI matches exactly
4. Consider using universal links for better reliability

