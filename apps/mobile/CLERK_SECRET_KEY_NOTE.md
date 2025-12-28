# ⚠️ IMPORTANT: Clerk Secret Key Security

## 🔒 Secret Key Location

**DO NOT** add the Clerk Secret Key (`sk_live_...`) to the mobile app!

The secret key you provided:
```
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
```

This key should **ONLY** be used in:
- ✅ **Server-side code** (Next.js API routes, backend services)
- ✅ **Environment variables** on your server/hosting platform
- ✅ **Never in mobile apps** or client-side code

## 📱 Mobile App Configuration

The mobile app uses **ONLY** the publishable key:
```
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

This key is:
- ✅ Safe to include in mobile apps
- ✅ Stored in EAS Secrets for production builds
- ✅ Configured in `eas.json` for production profile

## 🖥️ Server Configuration

Add the secret key to your **server environment variables**:

### For Vercel/Next.js:
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - `CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE`

### For Other Hosting:
Add to your `.env.production` or server environment:
```bash
CLERK_SECRET_KEY=sk_live_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PUBLISHABLE_KEY_HERE
```

## ✅ What's Configured

### Mobile App (EAS):
- ✅ Production publishable key stored in EAS Secrets
- ✅ Production publishable key in `eas.json`
- ✅ Ready for production builds

### Server (Next.js):
- ⚠️ **You need to add** `CLERK_SECRET_KEY` to your server environment
- ⚠️ **You need to add** `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` to your server environment

## 🔐 Security Best Practices

1. **Never commit secret keys to git**
   - Add `*.env.production` to `.gitignore`
   - Never commit `.env` files with secret keys

2. **Use environment variables**
   - Store keys in hosting platform's environment variables
   - Use different keys for development and production

3. **Rotate keys if compromised**
   - Generate new keys in Clerk dashboard
   - Update all environments
   - Rebuild and redeploy

## 📝 Summary

- ✅ **Mobile app**: Uses publishable key only (safe for client-side)
- ⚠️ **Server**: Needs secret key in environment variables (server-side only)
- ✅ **Production key**: Configured and ready for mobile builds

---

**Last Updated**: $(date)

