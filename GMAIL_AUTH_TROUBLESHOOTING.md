# 🔧 Gmail Authentication Troubleshooting

## ✅ Configuration Found

Your Gmail OAuth is configured! Here's what I found:

```bash
GMAIL_CLIENT_ID=*** (configured)
GMAIL_CLIENT_SECRET=*** (configured)
GMAIL_REDIRECT_URI=http://localhost:3002/api/gmail-callback
```

---

## 🎯 Common Issues & Fixes

### Issue #1: Port Mismatch

**Check**: Your Next.js runs on port `3002` (confirmed in package.json)

**Verify**:
1. When you run the app, does it open on `http://localhost:3002`?
2. In Google Cloud Console, is the redirect URI exactly:
   ```
   http://localhost:3002/api/gmail-callback
   ```

**Fix if needed**:
- Go to Google Cloud Console → Credentials → Your OAuth Client
- Ensure **Authorized redirect URIs** includes:
  ```
  http://localhost:3002/api/gmail-callback
  https://comfort-finder-analyzer.vercel.app/api/gmail-callback
  ```

---

### Issue #2: Environment Variables Not Loaded

**Next.js needs `.env.local` not `.env`**

**Fix**:
```bash
cd /Users/v/Downloads/DealAnalyzer

# Copy Gmail vars from .env to .env.local
cat .env | grep "^GMAIL_" >> .env.local

# Verify
cat .env.local | grep GMAIL_
```

**OR** manually add to `.env.local`:
```bash
GMAIL_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your_client_secret_here
GMAIL_REDIRECT_URI=http://localhost:3002/api/gmail-callback
```

Then restart your dev server:
```bash
npm run dev:next
```

---

### Issue #3: OAuth Consent Screen Not Configured

**Symptoms**:
- Error: "This app hasn't been verified"
- Error: "Access blocked"

**Fix**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. **APIs & Services** → **OAuth consent screen**
4. Ensure:
   - ✅ App name filled in
   - ✅ Support email added
   - ✅ Privacy Policy URL: `https://comfort-finder-analyzer.vercel.app/privacy.html`
   - ✅ Scopes: `https://www.googleapis.com/auth/gmail.readonly`
   - ✅ Test users: Add your email address

---

### Issue #4: Wrong OAuth Client Type

**Your app needs a "Web application" OAuth client, NOT "Desktop app" or "iOS/Android"**

**Verify**:
1. Google Cloud Console → Credentials
2. Check your OAuth 2.0 Client ID type
3. Should say: **"Web application"**

**If wrong type**:
- Create new OAuth client: **Web application**
- Add redirect URIs (see Issue #1)
- Update `.env.local` with new Client ID and Secret

---

### Issue #5: Redirect URI Mismatch (Most Common!)

**Error message**:
```
Error 400: redirect_uri_mismatch
```

**This means**: The redirect URI in your code doesn't EXACTLY match Google Cloud Console

**Fix**:

1. **Check what your app is using**:
   ```bash
   # Look at your .env
   grep GMAIL_REDIRECT_URI /Users/v/Downloads/DealAnalyzer/.env.local
   ```

2. **Go to Google Cloud Console** → Credentials → Your OAuth Client

3. **Verify EXACT match** (case-sensitive, including http/https, port, path):
   - ✅ Correct: `http://localhost:3002/api/gmail-callback`
   - ❌ Wrong: `http://localhost:3000/api/gmail-callback` (different port)
   - ❌ Wrong: `https://localhost:3002/api/gmail-callback` (https instead of http)
   - ❌ Wrong: `http://localhost:3002/api/gmail-callback/` (trailing slash)

---

### Issue #6: Cookies Not Being Set

**Symptoms**:
- "Gmail Connected" shows, but status still says "Not Connected"
- Works in callback but not in app

**Debug**:
```bash
# Check if cookies are being set (in browser DevTools)
# 1. Go to http://localhost:3002/deals
# 2. Open DevTools (F12)
# 3. Go to Application → Cookies → localhost:3002
# 4. Look for "gmailTokens" cookie

# If missing after successful auth, check:
```

**Fix**:
1. **Clear all cookies** for `localhost:3002`
2. **Disable browser extensions** that block cookies (Privacy Badger, uBlock Origin, etc.)
3. **Check sameSite setting**: Your code uses `'lax'` which should work
4. **Verify httpOnly**: Cookie should be httpOnly for security

---

### Issue #7: Clerk Authentication Conflict

**If you're not signed in to Clerk, Gmail OAuth might fail**

**Fix**:
```bash
# Option 1: Sign in to Clerk first
# Go to http://localhost:3002
# Click "Sign In"
# Then try Gmail connection

# Option 2: Test without Clerk (temporary)
# The code already handles this via bearer tokens
```

---

## 🧪 Step-by-Step Testing

### Test 1: Verify Environment Variables

```bash
cd /Users/v/Downloads/DealAnalyzer

# Check if vars are present
cat .env.local | grep GMAIL_

# Should see:
# GMAIL_CLIENT_ID=...
# GMAIL_CLIENT_SECRET=...
# GMAIL_REDIRECT_URI=http://localhost:3002/api/gmail-callback
```

### Test 2: Check OAuth URL Generation

```bash
# Start dev server
npm run dev:next

# In another terminal, test the auth URL endpoint:
curl http://localhost:3002/api/gmail-auth-url

# Should return JSON with "authUrl" field
# If error "Unauthorized", you need to sign in to Clerk first
```

### Test 3: Manual OAuth Flow

1. Sign in to Clerk: `http://localhost:3002`
2. Go to: `http://localhost:3002/deals`
3. Click "Connect Gmail"
4. Should open Google OAuth consent screen
5. Select account (must be test user in Google Cloud Console)
6. Grant permissions
7. Should redirect to `http://localhost:3002/api/gmail-callback`
8. Should see success page
9. Page closes automatically
10. Back on `/deals`, should show "Gmail Connected"

### Test 4: Check Callback Logs

```bash
# With dev server running, watch logs after clicking "Connect Gmail"
# Look for:
# ✅ "[Gmail Callback] Retrieved userId from state parameter"
# ✅ "[Gmail Callback] Successfully exchanged code for tokens"
# ✅ "[Gmail Callback] Cookie set successfully"

# Common errors:
# ❌ "Failed to exchange authorization code for tokens" → redirect_uri_mismatch
# ❌ "No userId available" → Not signed in to Clerk
# ❌ "Error persisting tokens to database" → Convex not configured (non-critical)
```

---

## 🔍 Debug Checklist

Run through this checklist:

- [ ] Gmail OAuth credentials exist in `.env.local` (not just `.env`)
- [ ] GMAIL_REDIRECT_URI matches Google Cloud Console exactly
- [ ] Port in redirect URI matches your app (3002 not 3000)
- [ ] Google Cloud Console has redirect URI for localhost:3002
- [ ] OAuth consent screen is configured with privacy policy
- [ ] Your email is added as test user in Google Cloud Console
- [ ] OAuth client type is "Web application"
- [ ] Gmail API is enabled in Google Cloud Console
- [ ] Scope `gmail.readonly` is added in OAuth consent screen
- [ ] Browser cookies are enabled
- [ ] No cookie-blocking extensions active
- [ ] Signed in to Clerk before testing Gmail auth
- [ ] Dev server restarted after changing `.env.local`

---

## 🚀 Quick Fix Command

If everything looks right but still not working:

```bash
cd /Users/v/Downloads/DealAnalyzer

# 1. Ensure vars are in .env.local
echo "GMAIL_CLIENT_ID=$(grep GMAIL_CLIENT_ID .env | cut -d= -f2)" >> .env.local
echo "GMAIL_CLIENT_SECRET=$(grep GMAIL_CLIENT_SECRET .env | cut -d= -f2)" >> .env.local
echo "GMAIL_REDIRECT_URI=http://localhost:3002/api/gmail-callback" >> .env.local

# 2. Restart server
npm run dev:next

# 3. Clear browser cookies
# DevTools → Application → Cookies → Clear All

# 4. Sign in to Clerk first
# Go to http://localhost:3002 → Sign In

# 5. Try Gmail connection
# http://localhost:3002/deals → Connect Gmail
```

---

## 📊 Expected vs Actual

### Expected Behavior:

1. Click "Connect Gmail" → Opens Google OAuth popup
2. Select account → Grant permissions
3. Redirects to `/api/gmail-callback` → Shows success page
4. Popup closes → Returns to `/deals` page
5. Status updates to "Gmail Connected" (green checkmark)
6. Can now sync emails from Gmail

### Common Deviations:

| Issue | Cause | Fix |
|-------|-------|-----|
| Popup blocked | Browser popup blocker | Allow popups for localhost:3002 |
| Error 400 redirect_uri_mismatch | URI doesn't match Google Console | Update Google Console redirect URIs |
| "App hasn't been verified" | Normal for development | Click "Advanced" → "Go to app (unsafe)" |
| Success page but still "Not Connected" | Cookies not being set | Check browser cookie settings |
| "Unauthorized" error | Not signed in to Clerk | Sign in first |

---

## 🛠️ Production Deployment

When deploying to Vercel:

1. **Add environment variables** in Vercel dashboard:
   ```
   GMAIL_CLIENT_ID=your_client_id
   GMAIL_CLIENT_SECRET=your_secret
   ```
   (Don't add GMAIL_REDIRECT_URI - it's dynamic in your code)

2. **Update Google Cloud Console redirect URIs**:
   ```
   https://comfort-finder-analyzer.vercel.app/api/gmail-callback
   https://your-custom-domain.com/api/gmail-callback
   ```

3. **Redeploy** after adding env vars

---

## 💡 What to Tell Me

If still having issues, please share:

1. **What happens when you click "Connect Gmail"?**
   - Popup opens? Error message? Nothing happens?

2. **Any error messages in browser console?**
   - Press F12 → Console tab → Look for red errors

3. **What do the server logs show?**
   - Run `npm run dev:next` and watch the terminal output

4. **What's the exact URL when it fails?**
   - Copy the URL from the error page

5. **Screenshot if helpful!**

---

**Your Gmail OAuth is configured - we just need to identify the specific issue!** 🔍
