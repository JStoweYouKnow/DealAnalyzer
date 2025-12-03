# Email Verification Setup Guide

## Issue: Verification Code Not Being Sent

If you're not receiving verification codes when creating an account, check the following:

## 1. Check Clerk Dashboard Settings

### Enable Email Authentication
1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Navigate to **User & Authentication** → **Email, Phone, Username**
3. Ensure **Email** is enabled
4. Ensure **Email address** is checked as an identifier

### Enable Email Verification
1. Go to **User & Authentication** → **Email**
2. Ensure **Email verification** is enabled
3. Check the verification method:
   - **Email code** (6-digit code) - Recommended
   - **Email link** (magic link)
   - Both

### Check Email Provider Settings
1. Go to **User & Authentication** → **Email**
2. Check **Email provider** settings:
   - **Clerk's default email service** (should work out of the box)
   - Or your custom SMTP provider

## 2. Check Console Logs

When you try to sign up, check the console for:

### Success Messages:
```
[SignUp] Preparing email verification...
[SignUp] ✅ Email verification code sent successfully
```

### Error Messages:
```
[SignUp] ❌ Error preparing email verification: ...
```

Common errors:
- `Email verification is not enabled` - Enable it in Clerk dashboard
- `Email provider not configured` - Check email provider settings
- `Network error` - Check internet connection

## 3. Verify Email Address

Make sure:
- The email address is valid and accessible
- You're checking the correct inbox (including spam/junk)
- The email hasn't been blocked by your email provider

## 4. Check Clerk Instance Configuration

1. Go to Clerk Dashboard
2. Check the instance name (top-left)
3. Verify you're in the **production** instance (if using production key)
4. Check **Settings** → **Email** for any restrictions

## 5. Test Email Sending

1. In Clerk Dashboard, go to **Users**
2. Try creating a test user manually
3. Check if verification emails are sent

## 6. Common Issues and Fixes

### Issue: "Email verification is not enabled"
**Fix:** Enable email verification in Clerk Dashboard → **User & Authentication** → **Email** → **Email verification**

### Issue: "Email provider not configured"
**Fix:** 
- Use Clerk's default email service (enabled by default)
- Or configure custom SMTP in **Settings** → **Email**

### Issue: Email goes to spam
**Fix:**
- Check spam/junk folder
- Add Clerk's email domain to your contacts
- Configure SPF/DKIM records if using custom domain

### Issue: Network error
**Fix:**
- Check internet connection
- Disable VPN if active
- Check firewall settings

## 7. Alternative: Use Email Link Instead

If email codes aren't working, you can use email links:

1. In Clerk Dashboard → **User & Authentication** → **Email**
2. Enable **Email link** verification
3. Update the sign-up code to use `'email_link'` strategy:
   ```typescript
   await signUp.prepareEmailAddressVerification({ strategy: 'email_link' });
   ```

## 8. Debug Steps

1. **Check console logs** when signing up
2. **Verify email in Clerk Dashboard** - Check if the user was created
3. **Check email inbox** - Including spam folder
4. **Try resending code** - Use the "Resend" button
5. **Check Clerk Dashboard logs** - Look for email sending errors

## 9. Contact Clerk Support

If none of the above works:
1. Check [Clerk Status Page](https://status.clerk.com/)
2. Check [Clerk Documentation](https://clerk.com/docs)
3. Contact [Clerk Support](https://clerk.com/support)

## Quick Checklist

- [ ] Email is enabled in Clerk Dashboard
- [ ] Email verification is enabled
- [ ] Email code strategy is selected
- [ ] Email provider is configured (Clerk default or custom)
- [ ] Console shows "Email verification code sent successfully"
- [ ] Checked spam/junk folder
- [ ] Internet connection is working
- [ ] Using correct Clerk instance (production vs test)

