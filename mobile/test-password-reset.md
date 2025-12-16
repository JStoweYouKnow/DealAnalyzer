# 🧪 Password Reset Testing Guide

**Version:** Build 5  
**Date:** December 5, 2025

---

## 📱 Test on Device/Simulator

### Prerequisites:
1. App running on iOS device or simulator
2. Valid test email account
3. Console logs visible (if using simulator)

---

## ✅ Test Case 1: Successful Password Reset

### Steps:
1. Open app → Sign In screen
2. Enter email: `test@example.com`
3. Click "Forgot Password?"
4. **Expected:** Alert "Reset Code Sent"
5. Check email for 6-digit code
6. Enter code in "Reset Code" field
7. Enter new password (8+ characters)
8. Confirm new password (same as above)
9. Click "Reset Password"
10. **Expected:** Alert "Password reset successful!"
11. **Expected:** Automatically signed in to app

### Console Logs to Watch:
```
[Password Reset] Initiating password reset for: test@example.com
[Password Reset] Available methods on signIn: [...]
[Password Reset] Supported factors: ['reset_password_email_code']
[Password Reset] Using prepareFirstFactor with reset_password_email_code
[Password Reset] ✅ Password reset code sent
[Password Reset] Attempting to reset password...
[Password Reset] Using resetPassword method
[Password Reset] Reset result: { status: 'complete', createdSessionId: 'sess_...' }
```

---

## ❌ Test Case 2: Invalid Email

### Steps:
1. Sign In screen
2. Enter email: `nonexistent@example.com`
3. Click "Forgot Password?"
4. **Expected:** Error alert about account not found

---

## ❌ Test Case 3: Wrong Reset Code

### Steps:
1. Request password reset
2. Receive code via email
3. Enter wrong code: `000000`
4. Enter new password
5. Click "Reset Password"
6. **Expected:** Alert "Password reset incomplete" or "Invalid code"

---

## ❌ Test Case 4: Passwords Don't Match

### Steps:
1. Request password reset
2. Receive code
3. Enter valid code
4. New password: `password123`
5. Confirm password: `password456` (different)
6. Click "Reset Password"
7. **Expected:** Alert "Passwords do not match"

---

## ❌ Test Case 5: Password Too Short

### Steps:
1. Request password reset
2. Receive code
3. Enter valid code
4. New password: `pass` (< 8 characters)
5. Confirm password: `pass`
6. Click "Reset Password"
7. **Expected:** Alert "Password must be at least 8 characters"

---

## ❌ Test Case 6: Empty Fields

### Steps:
1. Request password reset
2. Leave fields empty
3. Click "Reset Password"
4. **Expected:** Alert "Please fill in all fields"

---

## 🔍 Debugging Tips

### If reset code isn't sent:

1. **Check Clerk Dashboard:**
   - Go to: Dashboard → User & Authentication
   - Verify "Email verification code" is enabled
   - Verify "Password reset" is enabled

2. **Check Console Logs:**
   ```
   [Password Reset] Supported factors: [...]
   ```
   - Should include `'reset_password_email_code'`
   - If empty or missing, enable in Clerk dashboard

3. **Check Email Provider:**
   - Clerk → Settings → Email/SMS
   - Verify email provider is configured
   - Check spam folder for reset emails

### If resetPassword returns undefined:

1. **Check Console:**
   ```
   [Password Reset] Available methods on signIn: [...]
   ```
   - Should include `resetPassword`
   - If missing, check Clerk version

2. **Verify signIn object:**
   ```typescript
   console.log('signIn object:', signIn);
   console.log('signIn.resetPassword:', typeof signIn.resetPassword);
   ```

---

## 📊 Success Criteria

✅ Password reset code sent successfully  
✅ User receives email with code  
✅ Code validates correctly  
✅ Password updates in Clerk  
✅ User automatically signed in  
✅ No console errors  
✅ Clear error messages for failures

---

## 🚨 Common Issues & Solutions

### Issue: "prepareFirstFactor is not a function"
**Solution:** Update Clerk to v2.19+
```bash
npm install @clerk/clerk-expo@latest
```

### Issue: "reset_password_email_code not in supported factors"
**Solution:** Enable password reset in Clerk dashboard

### Issue: "resetPassword is not a function"
**Solution:** Code now falls back to `attemptFirstFactor()` automatically

### Issue: Code email not received
**Solution:** 
- Check Clerk email provider settings
- Check spam folder
- Verify email address is correct
- Check Clerk logs for delivery status

---

## 📝 Manual Test Script

Copy this and follow along:

```
□ Open app
□ Go to Sign In screen
□ Enter test email
□ Click "Forgot Password?"
□ See "Reset Code Sent" alert
□ Check email inbox
□ Find 6-digit code
□ Enter code in app
□ Enter new password (8+ chars)
□ Confirm password (same)
□ Click "Reset Password"
□ See "Success" alert
□ Automatically signed in
□ Test sign out
□ Sign in with new password
□ Success!
```

---

## 🎯 Next Steps

1. **Test locally** with the steps above
2. **If working:** Archive Build 5
3. **Upload to TestFlight**
4. **Test on physical device**
5. **Monitor for any errors**

---

*Complete fix with proper Clerk API methods - December 5, 2025*



