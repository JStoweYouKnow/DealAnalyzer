# 🔐 Clerk Production Setup Guide

This guide will walk you through setting up a production Clerk instance for your mobile app.

## 📋 Prerequisites

- Clerk account (sign up at https://clerk.com if you don't have one)
- Access to your Clerk dashboard
- Your app's production domain/URL (if applicable)

---

## Step 1: Create Production Clerk Application

### 1.1 Access Clerk Dashboard

1. Go to https://dashboard.clerk.com
2. Log in to your Clerk account

### 1.2 Create New Production Application

1. Click **"Create Application"** or **"Add Application"** button
2. Choose **"Production"** environment (not Development/Test)
3. Fill in the application details:
   - **Application Name**: `The Comfort Finder` (or your preferred name)
   - **Authentication Methods**: 
     - ✅ Email (required)
     - ✅ Google OAuth (recommended)
     - ✅ Apple (recommended for iOS)
     - Add any other methods you need

### 1.3 Configure Application Settings

1. **Allowed Origins** (if using web):
   - Add your production domain: `https://comfortfinder.com`
   - Add your API domain: `https://api.comfortfinder.com`

2. **Redirect URLs**:
   - Add your app's deep link scheme: `dealanalyzer://`
   - Add any web redirect URLs if applicable

3. **Session Settings**:
   - Configure session lifetime (default is usually fine)
   - Enable multi-factor authentication if needed

---

## Step 2: Get Your Production Keys

### 2.1 Find Your Publishable Key

1. In your Clerk dashboard, go to **"API Keys"** or **"Keys"** section
2. Look for the **Publishable Key** that starts with `pk_live_...`
3. **Copy this key** - you'll need it in the next step

⚠️ **Important**: 
- Production keys start with `pk_live_`
- Test/Development keys start with `pk_test_`
- Make sure you're copying the **Production** key!

### 2.2 (Optional) Get Secret Key

The secret key is only needed for backend/server operations. For mobile apps, you typically only need the publishable key.

---

## Step 3: Update EAS Configuration

### 3.1 Update eas.json

Open `mobile/eas.json` and update the `production` section with your actual keys:

```json
"production": {
  "ios": {
    "buildConfiguration": "Release"
  },
  "android": {
    "buildType": "app-bundle"
  },
  "env": {
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_ACTUAL_PRODUCTION_KEY_HERE",
    "EXPO_PUBLIC_CONVEX_URL": "https://your-prod.convex.cloud",
    "EXPO_PUBLIC_API_URL": "https://api.comfortfinder.com"
  }
}
```

**Replace**:
- `pk_live_YOUR_ACTUAL_PRODUCTION_KEY_HERE` with your actual production publishable key
- `https://your-prod.convex.cloud` with your production Convex URL
- `https://api.comfortfinder.com` with your production API URL

### 3.2 Verify Configuration

After updating, your `eas.json` should look like this (with your actual values):

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_abc123xyz...",
        "EXPO_PUBLIC_CONVEX_URL": "https://your-app.convex.cloud",
        "EXPO_PUBLIC_API_URL": "https://api.comfortfinder.com"
      }
    }
  }
}
```

---

## Step 4: (Recommended) Use EAS Secrets for Security

Instead of hardcoding keys in `eas.json`, you can use EAS Secrets for better security:

### 4.1 Set EAS Secrets

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile

# Set Clerk production key
eas secret:create --scope project --name EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY --value "pk_live_YOUR_KEY" --type string

# Set Convex URL
eas secret:create --scope project --name EXPO_PUBLIC_CONVEX_URL --value "https://your-prod.convex.cloud" --type string

# Set API URL
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value "https://api.comfortfinder.com" --type string
```

### 4.2 Update eas.json to Use Secrets

If using EAS secrets, you can remove the `env` section from `eas.json` - EAS will automatically inject secrets during build. However, you can also keep them as fallbacks:

```json
"production": {
  "env": {
    // These will be overridden by EAS secrets if they exist
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_KEY"
  }
}
```

---

## Step 5: Configure Clerk for Mobile App

### 5.1 Set Up OAuth Providers (if using)

#### Google OAuth:
1. Go to Clerk Dashboard → **"User & Authentication"** → **"Social Connections"**
2. Enable **Google**
3. Follow the setup instructions to configure Google OAuth credentials

#### Apple OAuth (for iOS):
1. Enable **Apple** in Social Connections
2. Configure with your Apple Developer account credentials

### 5.2 Configure Email Templates (Optional)

1. Go to **"Email"** section in Clerk dashboard
2. Customize email templates for:
   - Welcome emails
   - Password reset
   - Email verification
   - etc.

---

## Step 6: Test Your Configuration

### 6.1 Verify Keys Are Loaded

Your app already has logging to verify Clerk configuration. When you run the app, check the console for:

```
✅ Clerk PRODUCTION key configured
```

If you see:
```
❌ Clerk publishable key is not configured
```

Then the key isn't being loaded correctly.

### 6.2 Test Authentication Flow

1. Build a development build with production keys:
   ```bash
   cd mobile
   eas build --platform ios --profile production
   ```

2. Test sign-up, sign-in, and authentication flows

3. Verify users are created in your Clerk dashboard

---

## Step 7: Production Checklist

Before deploying to production, verify:

- [ ] Production Clerk application created
- [ ] Production publishable key (`pk_live_...`) copied
- [ ] `eas.json` updated with production key
- [ ] OAuth providers configured (if using)
- [ ] Email templates customized (optional)
- [ ] Allowed origins configured (if using web)
- [ ] Tested authentication flow
- [ ] Users can sign up and sign in successfully
- [ ] Production Convex URL configured
- [ ] Production API URL configured

---

## 🔒 Security Best Practices

1. **Never commit production keys to git**
   - Use EAS Secrets instead of hardcoding in `eas.json`
   - Add `*.env.production` to `.gitignore`

2. **Use different keys for different environments**
   - Development: `pk_test_...`
   - Preview/Staging: `pk_test_...` (separate test instance)
   - Production: `pk_live_...`

3. **Rotate keys if compromised**
   - Go to Clerk dashboard → API Keys
   - Generate new keys
   - Update `eas.json` or EAS secrets
   - Rebuild and redeploy

4. **Monitor Clerk dashboard**
   - Check for suspicious activity
   - Review authentication logs
   - Monitor API usage

---

## 🐛 Troubleshooting

### Issue: "Clerk publishable key is not configured"

**Solution**:
1. Verify the key is in `eas.json` under `production.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`
2. Check that the key starts with `pk_live_` (for production)
3. Rebuild the app: `eas build --platform ios --profile production --clear-cache`

### Issue: Authentication not working in production build

**Solution**:
1. Verify you're using production key (`pk_live_`) not test key (`pk_test_`)
2. Check Clerk dashboard for any errors
3. Verify allowed origins are configured correctly
4. Check network connectivity in the app

### Issue: OAuth providers not working

**Solution**:
1. Verify OAuth credentials are configured in Clerk dashboard
2. Check redirect URLs match your app's scheme
3. For iOS, ensure associated domains are configured in `app.json`

---

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Clerk Expo SDK](https://clerk.com/docs/quickstarts/expo)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [EAS Secrets Documentation](https://docs.expo.dev/build-reference/variables/)

---

## ✅ Next Steps

After setting up Clerk production:

1. Set up production Convex instance (see `SETUP_FOR_APP_STORE.md`)
2. Configure production API endpoints
3. Build production app: `eas build --platform ios --profile production`
4. Test thoroughly before App Store submission

---

**Need Help?** Check the Clerk dashboard logs or contact Clerk support at https://clerk.com/support

