# Gmail Status Update Debugging

## Issue
Gmail authentication succeeds but the app doesn't update to show connected status.

## Changes Made

### 1. Deep Link Handler (`App.tsx`)
- **Always invalidates queries** when `gmail-callback` deep link is received (not just when `success=true`)
- **Removes queries from cache** before invalidating to force fresh fetch
- **Refetches after 2 second delay** to allow tokens to be stored in database

### 2. Email Settings Screen (`EmailSettingsScreen.tsx`)
- **Added polling**: Checks status every 3 seconds when not connected (stops when connected)
- **Multiple refetch attempts**: Refetches at 1s, 3s delays when screen comes into focus
- **Multiple refetch attempts**: Refetches at 1s, 3s delays when app becomes active
- **Manual refresh button**: Tap refresh icon next to status to force immediate check

### 3. Status Query Configuration
- **Polling enabled**: Automatically checks every 3 seconds if not connected
- **No caching**: `staleTime: 0` and `gcTime: 0` to always get fresh data
- **Aggressive refetching**: Multiple retries and refetch on mount/focus

## How to Test

1. **Connect Gmail**:
   - Go to Email Settings
   - Tap "Connect Gmail Account"
   - Complete OAuth in browser
   - Return to app

2. **Check Console Logs**:
   Look for these log messages:
   - `[Deep Link] ✅ Gmail callback received, invalidating queries...`
   - `[Gmail Status] Fetching status...`
   - `[Gmail Status] Parsed result: { connected: true }`
   - `[Gmail Status] ✅ Newly connected - invalidating queries...`

3. **Manual Refresh**:
   - If status doesn't update, tap the refresh icon (🔄) next to "Gmail account connected"
   - Or pull down to refresh on the Email Settings screen

4. **Check API Response**:
   - Look for `[Gmail Status Check] ✅ Valid tokens found in database`
   - Or `[Gmail Status Check] ⚠️ No valid tokens in database`

## Troubleshooting

### Status Still Shows "Not Connected"

1. **Check if tokens are in database**:
   - Look for console log: `[Gmail Status Check] Database query result`
   - If `hasDbTokens: false`, tokens weren't stored

2. **Check if userId is available**:
   - Look for: `[Gmail Status Check] userId: user_xxx...`
   - If missing, authentication token might not be sent

3. **Check API response**:
   - Look for: `[Gmail Status] Parsed result: { connected: false }`
   - This means API returned `connected: false`

4. **Manual test**:
   - Tap refresh icon multiple times
   - Check if polling is working (should see logs every 3 seconds)

### Deep Link Not Triggering

1. **Check if deep link is received**:
   - Look for: `[Deep Link] Received: dealanalyzer://gmail-callback...`
   - If missing, deep link isn't being triggered

2. **Check callback route**:
   - Server logs should show: `[Gmail Callback] ✅ SUCCESS - Tokens stored and ready`
   - Check if redirect to deep link is happening

### Tokens Not in Database

1. **Check callback route logs**:
   - Look for: `[Gmail Callback] Tokens persisted to database`
   - If missing, database write failed

2. **Check userId in callback**:
   - Look for: `[Gmail Callback] Retrieved userId from state parameter`
   - If missing, userId wasn't passed in OAuth state

## Expected Behavior

1. **After OAuth completes**:
   - Deep link handler invalidates queries
   - Status query refetches automatically
   - Polling stops when `connected: true`
   - Deals query invalidates and refetches

2. **When screen comes into focus**:
   - Status refetches immediately
   - Status refetches again at 1s and 3s delays

3. **When app becomes active**:
   - Status refetches immediately
   - Status refetches again at 1s and 3s delays

4. **Polling**:
   - Checks every 3 seconds if not connected
   - Stops automatically when connected

## Next Steps if Still Not Working

1. **Check server logs** for token storage
2. **Check mobile console** for query invalidation logs
3. **Test API directly**: `GET /api/gmail-status` with bearer token
4. **Verify database**: Check Convex dashboard for stored tokens
5. **Check userId**: Ensure bearer token includes correct userId

