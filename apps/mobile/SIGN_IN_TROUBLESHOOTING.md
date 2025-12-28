# Sign In Troubleshooting Guide

## Common Issues and Solutions

### 1. Check Console Logs
After the updates, the app now logs important information:
- ✅ Clerk publishable key configuration status
- Auth state changes (isLoaded, isSignedIn)
- Sign-in attempt details
- Error messages with details

**Check your Metro bundler console for these logs when attempting to sign in.**

### 2. Verify Clerk Configuration

Your `app.json` should have:
```json
{
  "extra": {
    "clerkPublishableKey": "pk_test_c3BlY2lhbC1ib2FyLTE3LmNsZXJrLmFjY291bnRzLmRldiQ"
  }
}
```

✅ This is already configured correctly.

### 3. Network Connectivity

Clerk requires internet connectivity. Ensure:
- Your device/simulator has internet access
- No firewall is blocking Clerk API calls
- You're not on a VPN that might interfere

### 4. Account Status

Make sure:
- The account exists in your Clerk dashboard
- The account is not disabled
- You're using the correct email and password

### 5. SDK Compatibility

After upgrading to Expo SDK 54:
- ✅ `@clerk/clerk-expo@2.19.6` is installed
- ✅ `expo-auth-session` is installed
- ✅ `expo-web-browser` is installed
- ✅ `expo-secure-store` is installed

### 6. Clear Cache and Restart

If issues persist:
```bash
cd mobile
npx expo start --clear
```

### 7. Check Error Messages

The updated SignInScreen now shows:
- More detailed error messages
- Status information in console logs
- Better handling of incomplete sign-in states

### 8. Test with a New Account

Try creating a new account via the Sign Up screen to verify the flow works.

## Debug Steps

1. **Check Console Logs:**
   - Look for "✅ Clerk publishable key is configured"
   - Check "Auth state - isLoaded: true, isSignedIn: false" when on sign-in screen
   - Look for "Attempting to sign in with email: ..."
   - Check for any error messages

2. **Verify Navigation:**
   - After successful sign-in, you should see "Session activated successfully"
   - The app should automatically navigate to MainTabs

3. **Check Network:**
   - Open browser dev tools if using web
   - Check Network tab for Clerk API calls
   - Verify requests are not being blocked

## If Still Not Working

Please provide:
1. The exact error message shown in the alert
2. Console logs from Metro bundler
3. Whether you're testing on iOS, Android, or web
4. Whether you're using Expo Go or a development build

