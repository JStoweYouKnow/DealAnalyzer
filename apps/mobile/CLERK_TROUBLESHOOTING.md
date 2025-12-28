# Clerk Authentication Troubleshooting

## Issue: Account Not Found Despite Correct Key

If the Clerk key looks correct but sign-in still fails with "Account not found", check the following:

## 1. Verify Key is Actually Loaded

Check your app logs when it starts. You should see:
```
✅ Clerk PRODUCTION key configured
```

If you see:
```
❌ Clerk publishable key is not configured
```

Then the key isn't being loaded properly.

## 2. Check How Key is Loaded

The app loads the key from multiple sources in this order:
1. `process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` (from `.env.local` or environment)
2. `Constants.expoConfig?.extra?.clerkPublishableKey` (from `app.json` or `eas.json`)

**For Expo Go:**
- `.env.local` files are NOT automatically loaded
- You need to use `expo-constants` or set environment variables manually
- The key must be in `app.json` → `extra` section OR loaded via `expo-constants`

## 3. Add Key to app.json (For Expo Go)

Since Expo Go doesn't load `.env.local`, add the key to `app.json`:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "256e912e-3a30-479d-8524-c2c92a08f80a"
      },
      "clerkPublishableKey": "pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k"
    }
  }
}
```

**⚠️ WARNING:** This exposes the key in your code. For production builds, use EAS secrets instead.

## 4. Verify Account Exists in Correct Instance

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Check the instance name in the top-left
3. Verify the publishable key matches: `pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k`
4. Go to **Users** → Search for `projectcomfortdev@gmail.com`
5. If not found, create it in that instance

## 5. Check Clerk Configuration

In Clerk Dashboard, verify:
- **User & Authentication** → **Email** → Email is enabled
- **User & Authentication** → **Password** → Password authentication is enabled
- **User & Authentication** → **Email, Phone, Username** → Email is allowed as identifier

## 6. Check for Network Issues

- Verify your device/emulator has internet connectivity
- Check if Clerk's API is accessible (try visiting https://clerk.com)
- Check for any firewall or VPN blocking Clerk's servers

## 7. Enable Clerk Logging

Add this to your `App.tsx` to see detailed Clerk logs:

```typescript
// Add after ClerkProvider initialization
if (__DEV__) {
  console.log('Clerk Configuration:', {
    publishableKey: clerkPublishableKey?.substring(0, 30) + '...',
    keyType: clerkPublishableKey?.startsWith('pk_live') ? 'PRODUCTION' : 'TEST',
    keyLength: clerkPublishableKey?.length,
  });
}
```

## 8. Verify Sign-In Flow

The updated code now:
1. Creates sign-in attempt with identifier AND password
2. Checks for errors in `firstFactorVerification`
3. Handles `needs_first_factor` status
4. Provides detailed error messages

Check your logs for:
- `Creating sign-in attempt for: projectcomfortdev@gmail.com`
- `Using Clerk key: pk_live_...`
- `Sign in create result: { status: ..., ... }`

## 9. Common Issues

### Issue: Key Not Loading in Expo Go
**Solution:** Add key to `app.json` → `extra` section (see #3 above)

### Issue: Account in Different Instance
**Solution:** Create account in the production instance where your key points

### Issue: Password Authentication Disabled
**Solution:** Enable password authentication in Clerk Dashboard

### Issue: Email Not Verified
**Solution:** Verify the email in Clerk Dashboard or use admin verification

## 10. Test with Different Account

Try creating a new test account:
1. In Clerk Dashboard → **Users** → **Create User**
2. Use a different email (e.g., `test@example.com`)
3. Set a password
4. Try signing in with that account

If the new account works, the issue is specific to the original account.

## Next Steps

1. Add the key to `app.json` if using Expo Go
2. Verify account exists in the correct Clerk instance
3. Check Clerk Dashboard configuration
4. Review app logs for detailed error messages
5. Try creating a new test account

