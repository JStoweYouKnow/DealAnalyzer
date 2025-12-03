# 🔧 Gmail OAuth Setup & Fix Guide

## Issue Identified

Your Gmail authentication is missing the required OAuth credentials. The code is ready, you just need to configure Google OAuth.

---

## 📋 Step-by-Step Setup

### Step 1: Create Google Cloud Project (5 minutes)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project" or select existing project
3. Name it: "The Comfort Finder" (or your app name)
4. Click "Create"

### Step 2: Enable Gmail API (2 minutes)

1. In your Google Cloud project, go to **APIs & Services** → **Library**
2. Search for "Gmail API"
3. Click "Gmail API"
4. Click "Enable"

### Step 3: Configure OAuth Consent Screen (10 minutes)

1. Go to **APIs & Services** → **OAuth consent screen**
2. Choose **External** (unless you have Google Workspace)
3. Click "Create"

**Fill in Required Fields**:
- **App name**: `The Comfort Finder`
- **User support email**: Your email
- **App logo**: Upload your app icon (optional)
- **App domain**:
  - Homepage: `https://comfort-finder-analyzer.vercel.app`
  - Privacy Policy: `https://comfort-finder-analyzer.vercel.app/privacy.html`
  - Terms of Service: `https://comfort-finder-analyzer.vercel.app/terms.html`
- **Developer contact**: Your email

4. Click "Save and Continue"

**Scopes** (Step 2):
- Click "Add or Remove Scopes"
- Search for: `https://www.googleapis.com/auth/gmail.readonly`
- Select it (Description: "Read all email messages")
- Click "Update"
- Click "Save and Continue"

**Test Users** (Step 3) - IMPORTANT:
- While in development, add your email as a test user
- Click "Add Users"
- Enter your email address
- Click "Save and Continue"

5. Review and click "Back to Dashboard"

### Step 4: Create OAuth Credentials (5 minutes)

1. Go to **APIs & Services** → **Credentials**
2. Click "Create Credentials" → **OAuth 2.0 Client ID**
3. Choose application type: **Web application**
4. Name: "The Comfort Finder Web"

**Authorized JavaScript origins** - Add ALL of these:
```
http://localhost:3000
https://localhost:3000
https://comfort-finder-analyzer.vercel.app
https://your-custom-domain.com  # If you have one
```

**Authorized redirect URIs** - Add ALL of these:
```
http://localhost:3000/api/gmail-callback
https://localhost:3000/api/gmail-callback
https://comfort-finder-analyzer.vercel.app/api/gmail-callback
https://your-custom-domain.com/api/gmail-callback  # If you have one
```

5. Click "Create"
6. **COPY** your credentials:
   - Client ID (starts with numbers, ends with `.apps.googleusercontent.com`)
   - Client Secret (random string)

### Step 5: Add Credentials to Your App (2 minutes)

#### For Local Development:

Create/edit `.env.local`:
```bash
# Gmail OAuth Credentials
GMAIL_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_HERE
GOOGLE_REDIRECT_URI=http://localhost:3000/api/gmail-callback
```

#### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Click **Settings** → **Environment Variables**
3. Add these variables:

| Name | Value |
|------|-------|
| `GMAIL_CLIENT_ID` | Your Client ID |
| `GMAIL_CLIENT_SECRET` | Your Client Secret |
| `GOOGLE_CLIENT_ID` | Your Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Client Secret |
| `GOOGLE_REDIRECT_URI` | `https://comfort-finder-analyzer.vercel.app/api/gmail-callback` |

4. Click "Save"
5. **Redeploy** your app for changes to take effect

### Step 6: Mobile App Configuration (5 minutes)

For mobile OAuth to work, you need to create an additional iOS/Android OAuth client:

#### iOS OAuth Client:

1. In Google Cloud Console → **Credentials** → "Create Credentials"
2. Choose **OAuth 2.0 Client ID**
3. Application type: **iOS**
4. Name: "The Comfort Finder iOS"
5. Bundle ID: `com.comfortfinder.dealanalyzer` (from your app.json)
6. Click "Create"
7. Save the Client ID

#### Android OAuth Client:

1. Create Credentials → **OAuth 2.0 Client ID**
2. Application type: **Android**
3. Name: "The Comfort Finder Android"
4. Package name: `com.comfortfinder.dealanalyzer`
5. Get SHA-1 certificate fingerprint:
   ```bash
   # For development
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android

   # For production (after building with EAS)
   eas credentials
   ```
6. Enter the SHA-1 fingerprint
7. Click "Create"

---

## 🧪 Testing Gmail OAuth

### Test in Development:

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/deals

3. Click "Connect Gmail" button

4. Should open Google OAuth consent screen

5. Select your Gmail account (must be added as test user)

6. Grant permissions

7. Should redirect back and show "Gmail Connected"

### Common Test Issues:

**Error: "Access blocked: This app's request is invalid"**
- Solution: Check OAuth consent screen is configured
- Verify redirect URI is added to authorized redirect URIs
- Make sure it matches EXACTLY (including http vs https, trailing slash, etc.)

**Error: "redirect_uri_mismatch"**
- Solution: The redirect URI in your code doesn't match Google Cloud Console
- Check `.env.local` has correct `GOOGLE_REDIRECT_URI`
- Verify Google Cloud Console has matching redirect URI

**Error: "This app hasn't been verified"**
- This is normal for development
- Click "Advanced" → "Go to [App Name] (unsafe)"
- For production, you'll need to submit for verification

---

## 🚀 Production Deployment Checklist

Before going live:

- [ ] OAuth credentials added to Vercel environment variables
- [ ] Production redirect URI added to Google Cloud Console
- [ ] Privacy Policy accessible at public URL
- [ ] Terms of Service accessible at public URL
- [ ] Test users added (or app verified for public use)
- [ ] Redeployed Vercel app after adding env vars

---

## 📱 Mobile-Specific Setup

### iOS Deep Linking:

Add to `mobile/app.json`:
```json
"ios": {
  "bundleIdentifier": "com.comfortfinder.dealanalyzer",
  "associatedDomains": [
    "applinks:comfort-finder-analyzer.vercel.app"
  ]
}
```

### Android Deep Linking:

Add to `mobile/app.json`:
```json
"android": {
  "package": "com.comfortfinder.dealanalyzer",
  "intentFilters": [
    {
      "action": "VIEW",
      "autoVerify": true,
      "data": [
        {
          "scheme": "https",
          "host": "comfort-finder-analyzer.vercel.app",
          "pathPrefix": "/api/gmail-callback"
        }
      ],
      "category": ["BROWSABLE", "DEFAULT"]
    }
  ]
}
```

---

## 🔍 Troubleshooting

### "No credentials found in environment"

Check:
```bash
# In your terminal
echo $GMAIL_CLIENT_ID
echo $GMAIL_CLIENT_SECRET

# If empty, reload env vars:
source .env.local
```

### "Cookies not being set"

Issues:
- **Secure cookies**: Set `sameSite: 'lax'` (already done in code)
- **Domain mismatch**: Clear browser cookies and try again
- **HTTPS requirement**: In production, cookies require HTTPS

### "Tokens expire immediately"

- Google returns `refresh_token` only on first authorization
- Revoke access and re-authorize: https://myaccount.google.com/permissions
- Your code already handles refresh token preservation

### "Works locally but not in production"

1. Verify Vercel env vars are set
2. Check production redirect URI is authorized
3. Redeploy after adding env vars
4. Check Vercel logs: `vercel logs`

---

## 📊 Environment Variable Summary

| Variable | Local | Production | Mobile |
|----------|-------|------------|--------|
| `GMAIL_CLIENT_ID` | .env.local | Vercel | EAS Secrets |
| `GMAIL_CLIENT_SECRET` | .env.local | Vercel | EAS Secrets |
| `GOOGLE_REDIRECT_URI` | localhost | Vercel URL | App URL |

---

## 🎓 What Your Code Already Does

Your Gmail OAuth implementation is already production-ready:

✅ **Dual Auth Support**: Works with both Clerk (web) and Bearer tokens (mobile)
✅ **Token Persistence**: Stores tokens in Convex database + cookies
✅ **Refresh Token Handling**: Preserves refresh tokens across re-auth
✅ **Security**: httpOnly cookies, proper state parameter encoding
✅ **Mobile Support**: Deep linking and popup handling
✅ **Error Handling**: Comprehensive logging and fallbacks

**You just need to add the OAuth credentials!**

---

## 🚀 Quick Start Command

After adding credentials to `.env.local`:

```bash
# Restart dev server
npm run dev

# Test Gmail connection
open http://localhost:3000/deals
```

---

## 📞 Need Help?

- **Google OAuth Docs**: https://developers.google.com/identity/protocols/oauth2
- **Gmail API Scopes**: https://developers.google.com/gmail/api/auth/scopes
- **OAuth Consent Screen**: https://support.google.com/cloud/answer/10311615

---

**Your Gmail authentication will work perfectly once you complete Step 5!** 🎉
