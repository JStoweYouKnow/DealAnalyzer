# Vercel Deployment Fixes - Email Auth & Sync

## 🔴 Critical Errors Fixed

### 1. `/api/email-deals` returning 500 error
**Root Cause:** Convex database not configured or deployed
**Fix Applied:** Added graceful error handling to return empty array when Convex is unavailable

### 2. Gmail authentication not working
**Root Cause:** Cookie security settings not compatible with Vercel
**Fixes Applied:**
- Changed `secure: process.env.NODE_ENV === 'production'` to `secure: true` in all cookie settings
- Updated 3 files to always use secure cookies (Vercel always uses HTTPS)

---

## ✅ Files Modified

1. **[app/api/gmail-callback/route.ts](app/api/gmail-callback/route.ts#L43)** - Cookie security fix
2. **[app/api/gmail-status/route.ts](app/api/gmail-status/route.ts#L82)** - Cookie security fix  
3. **[app/api/sync-emails/route.ts](app/api/sync-emails/route.ts#L87,L171)** - Cookie security fix (2 places)
4. **[app/api/email-deals/route.ts](app/api/email-deals/route.ts#L9-L27)** - Added Convex error handling

---

## 🚀 Deployment Checklist

### Step 1: Set Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these variables:

```bash
# Gmail OAuth (REQUIRED for email sync)
GMAIL_CLIENT_ID=<YOUR_GOOGLE_CLIENT_ID>
GMAIL_CLIENT_SECRET=<YOUR_GOOGLE_CLIENT_SECRET>

# Convex Database (REQUIRED for storing data)
NEXT_PUBLIC_CONVEX_URL=<YOUR_CONVEX_URL>

# Clerk Authentication (REQUIRED for user auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<YOUR_CLERK_PUBLISHABLE_KEY>
CLERK_SECRET_KEY=<YOUR_CLERK_SECRET_KEY>

# Optional APIs
OPENAI_API_KEY=<YOUR_OPENAI_KEY>
RENTCAST_API_KEY=<YOUR_RENTCAST_KEY>
```

**⚠️ IMPORTANT:** After adding variables, click **Redeploy** for changes to take effect!

### Step 2: Configure Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Select your OAuth 2.0 Client ID
3. Under **Authorized redirect URIs**, add:
   ```
   https://your-app-name.vercel.app/api/gmail-callback
   ```
   Replace `your-app-name` with your actual Vercel deployment URL

4. Click **Save**

### Step 3: Deploy Convex

Run this command locally:
```bash
npm run convex:deploy
```

Verify the URL shown matches your `NEXT_PUBLIC_CONVEX_URL` in Vercel.

### Step 4: Deploy to Vercel

```bash
# Option 1: Deploy via Vercel CLI
vercel --prod

# Option 2: Push to main branch (if auto-deploy is enabled)
git push origin main
```

### Step 5: Verify Deployment

Test these endpoints in your browser or with curl:

```bash
# Replace with your Vercel URL
VERCEL_URL="https://your-app.vercel.app"

# Should return: {"success":true,"connected":false}
curl $VERCEL_URL/api/gmail-status

# Should return: [] or list of emails
curl $VERCEL_URL/api/email-deals

# Should return health status
curl $VERCEL_URL/api/health
```

---

## 🐛 Debugging Common Issues

### Issue 1: `redirect_uri_mismatch` Error

**Symptom:** Gmail auth fails with "redirect_uri_mismatch"

**Solution:**
1. Check your Vercel URL in the browser address bar
2. Go to Google Cloud Console
3. Add the EXACT URL with `/api/gmail-callback` suffix
4. Example: `https://comfort-finder-analyzer.vercel.app/api/gmail-callback`

### Issue 2: `/api/email-deals` returns 500

**Symptom:** Console shows "API request failed (/api/email-deals)"

**Solution:**
1. Check if `NEXT_PUBLIC_CONVEX_URL` is set in Vercel
2. Run `npm run convex:deploy` locally
3. Verify Convex URL matches environment variable
4. Check Vercel function logs for specific error

**After fix applied:** Now returns empty array `[]` if Convex unavailable (no more 500 error)

### Issue 3: Cookies Not Persisting

**Symptom:** Gmail auth succeeds but status shows "not connected"

**Solution:**
1. Clear all cookies for your domain
2. Try in incognito/private mode
3. Check DevTools → Application → Cookies for `gmailTokens`
4. Verify cookie has `HttpOnly` and `Secure` flags

**After fix applied:** Cookies now always use `secure: true` flag

### Issue 4: 404 Errors

**Symptom:** Console shows "Failed to load resource: 404"

**Possible causes:**
- Static asset not found (check build output)
- Route not deployed (check `vercel.json` configuration)
- Middleware blocking route (check `middleware.ts`)

**Solution:**
1. Check Vercel build logs for errors
2. Verify routes exist in `app/api/` directory
3. Check middleware public routes list

---

## 📊 How Email Auth Flow Works

```
1. User clicks "Connect Gmail"
   ↓
2. Frontend calls GET /api/gmail-auth-url
   - Dynamically generates redirect URI based on Vercel URL
   ↓
3. Opens OAuth popup to Google
   ↓
4. User authorizes
   ↓
5. Google redirects to /api/gmail-callback
   - Exchanges code for tokens
   - Stores in httpOnly cookie (secure: true)
   - Stores in Convex database
   - Sends postMessage to parent window
   ↓
6. Popup closes, parent window receives message
   ↓
7. Frontend refetches /api/gmail-status
   - Checks cookie for tokens
   - Returns connected: true
   ↓
8. Auto-triggers /api/sync-emails
   - Uses tokens from cookie
   - Auto-refreshes if expired
   - Fetches Gmail emails
   - Stores in Convex via server/storage
   ↓
9. Frontend refetches /api/email-deals
   - Gets email deals from Convex
   - Displays in UI
```

---

## 🔍 Vercel Function Logs

To debug issues, check function logs:

1. Go to **Vercel Dashboard**
2. Click on your latest **Deployment**
3. Click **Functions** tab
4. Look for errors in:
   - `/api/gmail-callback`
   - `/api/gmail-status`
   - `/api/sync-emails`
   - `/api/email-deals`

Look for these log messages:
- `[Gmail Status Check]` - Status endpoint logs
- `[Gmail Callback]` - OAuth callback logs
- `[Sync Emails]` - Email sync logs
- `CONVEX_URL not configured` - Missing env var
- `Convex storage not available` - Convex init failed

---

## ⚙️ Architecture Notes

### Serverless vs Express

Your app has TWO servers:
- **Express server** (`server/index.ts`) - Local development only, uses Redis sessions
- **Next.js API routes** (`app/api/`) - Production, uses cookies & Convex

**In Vercel:** Only Next.js routes are deployed (Express server is ignored)

### Session Management

**Local dev:**
- Express server uses `express-session` + Redis
- Sessions stored in Redis

**Production (Vercel):**
- Next.js API routes use cookies
- No Redis needed (serverless)
- Tokens stored in:
  - httpOnly cookies (24hr expiration)
  - Convex database (persistent)

---

## 📝 Summary of Changes

### Before:
- ❌ Cookies used `secure: process.env.NODE_ENV === 'production'`
- ❌ `/api/email-deals` threw 500 error if Convex unavailable
- ❌ No error handling for missing Convex URL

### After:
- ✅ Cookies always use `secure: true` (Vercel is always HTTPS)
- ✅ `/api/email-deals` returns empty array if Convex unavailable
- ✅ Graceful error handling with helpful log messages
- ✅ Better debugging output in console

---

## 🎯 Quick Fix Commands

```bash
# 1. Deploy Convex
npm run convex:deploy

# 2. Build Next.js locally to test
npm run build:next

# 3. Deploy to Vercel
vercel --prod

# 4. Check deployment status
vercel inspect <deployment-url>

# 5. View logs
vercel logs <deployment-url>
```

---

## ✅ Test Your Deployment

After deploying, test these workflows:

### Test 1: Gmail Connection
1. Go to `https://your-app.vercel.app/deals`
2. Click "Connect Gmail"
3. Complete OAuth flow
4. Popup should close automatically
5. Check console for `GMAIL_AUTH_SUCCESS` message
6. Verify "Sync Emails" button appears

### Test 2: Email Sync
1. Click "Sync Emails"
2. Wait for sync to complete
3. Check console for `[Sync Emails]` logs
4. Email deals should appear in the UI

### Test 3: API Endpoints
```bash
VERCEL_URL="https://your-app.vercel.app"

# Test Gmail status
curl $VERCEL_URL/api/gmail-status
# Expected: {"success":true,"connected":false}

# Test email deals
curl $VERCEL_URL/api/email-deals
# Expected: [] or [{"id":"...","subject":"...", ...}]
```

---

## 🆘 Still Having Issues?

If problems persist after following this guide:

1. **Check Vercel Logs:** Dashboard → Deployments → Functions
2. **Check Browser Console:** DevTools → Console (F12)
3. **Verify Environment Variables:** Dashboard → Settings → Environment Variables
4. **Test Locally First:** `npm run build:next && npm run start:next`
5. **Clear Cookies:** DevTools → Application → Cookies → Delete All

Common mistakes:
- Forgetting to redeploy after changing env vars
- Not adding redirect URI to Google Console
- Convex not deployed (`npm run convex:deploy`)
- Using wrong Vercel URL in Google Console

---

## 📞 Support

If you're still experiencing issues, collect this information:
1. Exact error message from browser console
2. Vercel function logs for failing endpoint
3. Your Vercel deployment URL
4. Screenshot of Google OAuth configuration

This will help diagnose the specific issue quickly.
