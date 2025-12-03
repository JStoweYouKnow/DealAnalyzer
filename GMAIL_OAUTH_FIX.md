# Gmail OAuth Fix for Mobile App

## Problem
The mobile app was unable to complete Gmail authorization because:
1. The app used `openAuthSessionAsync` with a deep link (`dealanalyzer://gmail-callback`)
2. The backend generated a web redirect URI (`https://comfort-finder-analyzer.vercel.app/api/gmail-callback`)
3. These didn't match, causing Google OAuth to fail

## Solution
Updated the OAuth flow to work properly with mobile apps:

### 1. Mobile App Changes (`EmailSettingsScreen.tsx`)
- Changed from `openAuthSessionAsync` to `openBrowserAsync`
- Removed the deep link redirect parameter (Google OAuth requires the web redirect URI)
- Added automatic status refresh when screen regains focus after OAuth

### 2. Backend Callback (`app/api/gmail-callback/route.ts`)
- Updated callback page to detect mobile devices
- Redirects to deep link `dealanalyzer://gmail-callback?success=true` on mobile
- Falls back to closing window on desktop

### 3. Deep Link Handling (`App.tsx`)
- Added deep link listener to handle `dealanalyzer://gmail-callback`
- Automatically triggers status refresh when OAuth completes

### 4. App Configuration (`app.json`)
- Added URL scheme: `"scheme": "dealanalyzer"`
- Added iOS associated domains for universal links

## How It Works Now

1. **User taps "Connect Gmail"** in the mobile app
2. **App opens browser** with Google OAuth URL (using web redirect URI)
3. **User authorizes** in the browser
4. **Google redirects** to `https://comfort-finder-analyzer.vercel.app/api/gmail-callback`
5. **Backend processes** OAuth callback and stores tokens
6. **Callback page detects mobile** and redirects to `dealanalyzer://gmail-callback?success=true`
7. **App receives deep link** and automatically refetches Gmail connection status
8. **UI updates** to show "Gmail account connected"

## Testing

1. Open the app and go to Email Settings
2. Tap "Connect Gmail Account"
3. Complete authorization in the browser
4. You should be redirected back to the app
5. The status should update to show "Gmail account connected"

## Troubleshooting

If authorization still doesn't work:

1. **Check Google Cloud Console**:
   - Ensure redirect URI `https://comfort-finder-analyzer.vercel.app/api/gmail-callback` is added
   - Verify OAuth client credentials are correct

2. **Check app.json**:
   - Verify `"scheme": "dealanalyzer"` is present
   - Verify bundle identifier matches

3. **Check logs**:
   - Look for `[Gmail Connect]` and `[Deep Link]` console logs
   - Check backend logs for OAuth callback processing

4. **Test deep link manually**:
   - Try opening `dealanalyzer://gmail-callback?success=true` in a browser
   - Should open the app (if installed)

## Next Steps

- The OAuth flow should now work end-to-end
- Status will automatically update when returning to the app
- No manual refresh needed


