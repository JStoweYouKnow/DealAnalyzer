# OAuth Redirect URI Fix for Mobile App

## Problem

The mobile app was experiencing `WebAuthenticationSession error 1` because:

1. **Server generates web redirect URI**: The `/api/gmail-auth-url` endpoint always generates a redirect URI like `https://comfortfinder.projcomfort.com/api/gmail-callback`
2. **Mobile app expected deep link**: `WebBrowser.openAuthSessionAsync` was configured with `dealanalyzer://gmail-callback` as the redirect URI
3. **Mismatch causes failure**: WebAuthenticationSession requires the redirect URI in the OAuth URL to match the expected redirect URI, causing error code 1

## Root Cause

Google OAuth requires redirect URIs to be registered in Google Cloud Console. Custom URL schemes (like `dealanalyzer://`) are typically not allowed as redirect URIs. The standard OAuth flow for mobile apps is:

1. OAuth URL uses **web redirect URI** (registered in Google Cloud Console)
2. User authorizes → Google redirects to **web callback**
3. Web callback processes tokens → redirects to **deep link**
4. Deep link opens the **mobile app**

## Solution

### Changed Approach

Instead of using `WebBrowser.openAuthSessionAsync` (which requires matching redirect URIs), we now use:

1. **`Linking.openURL`** - Opens the OAuth URL in the system browser
2. **Web callback handles redirect** - The existing `/api/gmail-callback` route processes tokens and redirects to `dealanalyzer://gmail-callback?success=true`
3. **Deep link opens app** - The app's deep link handler (in `App.tsx`) receives the callback

### Code Changes

#### Mobile App (`EmailSettingsScreen.tsx`)
- ✅ Removed `WebBrowser.openAuthSessionAsync` (doesn't work with web redirect URI)
- ✅ Added `Linking.openURL` as primary method
- ✅ Added `WebBrowser.openBrowserAsync` as fallback
- ✅ Added helpful user message explaining the flow

#### Server (`gmail-auth-url/route.ts`)
- ✅ Always uses web redirect URI (required by Google OAuth)
- ✅ Detects mobile requests for logging
- ✅ Web callback already handles deep link redirect (no changes needed)

## OAuth Flow

```
1. Mobile App
   └─> Calls /api/gmail-auth-url?platform=mobile
   
2. Server
   └─> Generates OAuth URL with redirect_uri=https://comfortfinder.projcomfort.com/api/gmail-callback
   
3. Mobile App
   └─> Opens OAuth URL with Linking.openURL()
   
4. System Browser
   └─> User authorizes Gmail access
   
5. Google
   └─> Redirects to https://comfortfinder.projcomfort.com/api/gmail-callback?code=...
   
6. Web Callback
   └─> Processes OAuth code, stores tokens
   └─> Returns HTML that redirects to dealanalyzer://gmail-callback?success=true
   
7. Mobile App
   └─> Deep link handler receives callback
   └─> Status check automatically triggered
```

## Benefits

1. ✅ **Works with Google OAuth requirements** - Uses registered web redirect URI
2. ✅ **No WebAuthenticationSession errors** - Doesn't require matching redirect URIs
3. ✅ **Standard OAuth flow** - Follows best practices for mobile OAuth
4. ✅ **Automatic status check** - Deep link handler triggers status refresh
5. ✅ **Better user experience** - Clear messaging about the flow

## Testing

1. **Test OAuth Flow**:
   - Tap "Connect Gmail Account"
   - Should open browser with Google OAuth
   - Complete authorization
   - Should redirect back to app
   - Status should show "connected"

2. **Check Logs**:
   ```
   [Gmail Connect] Opening OAuth URL with Linking...
   [Gmail Connect] Platform: ios
   [Gmail Connect] Auth URL redirect URI will be web callback
   ```

3. **Verify Deep Link**:
   - After OAuth, check that `dealanalyzer://gmail-callback?success=true` is received
   - Status should automatically update

## Notes

- The web callback (`/api/gmail-callback`) already handles redirecting to the deep link
- No changes needed to Google Cloud Console configuration
- Works on both iOS and Android
- Fallback to `WebBrowser.openBrowserAsync` if `Linking.openURL` fails

