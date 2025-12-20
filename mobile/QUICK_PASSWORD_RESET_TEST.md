# ⚡ Quick Password Reset Test

Run this to verify the fix works:

---

## 🚀 Quick Test (2 minutes)

### 1. Start the app:
```bash
cd /Users/v/Documents/DealAnalyzer/mobile
npm run ios
```

### 2. Test the flow:
```
1. Enter email: jhs91689@gmail.com (or your test email)
2. Click "Forgot Password?"
3. Watch console for:
   ✓ "[Password Reset] Using prepareFirstFactor"
   ✓ "[Password Reset] ✅ Password reset code sent"
4. Check email for code
5. Enter code + new password
6. Click "Reset Password"
7. Watch console for:
   ✓ "[Password Reset] Using resetPassword method"
   ✓ "[Password Reset] Reset result: { status: 'complete' }"
8. Should auto sign-in
```

---

## 🔍 What to Look For

### ✅ Success Indicators:
- Alert: "Reset Code Sent"
- Email received with code
- Alert: "Password reset successful!"
- Automatically signed in
- No console errors

### ❌ Failure Indicators:
- Console: "is not a function"
- Console: "undefined"
- No email received
- Error alerts

---

## 🐛 If It Still Fails

### Check Console Output:

1. **Look for this line:**
   ```
   [Password Reset] Available methods on signIn: [...]
   ```
   
2. **Should include:**
   - `create`
   - `prepareFirstFactor`
   - `attemptFirstFactor`
   - `resetPassword`

3. **If methods are missing:**
   ```bash
   # Reinstall Clerk
   cd /Users/v/Documents/DealAnalyzer/mobile
   npm install @clerk/clerk-expo@latest
   cd ios && pod install
   ```

### Check Supported Factors:

1. **Look for this line:**
   ```
   [Password Reset] Supported factors: [...]
   ```

2. **Should include:**
   - `'reset_password_email_code'`

3. **If missing:**
   - Go to Clerk Dashboard
   - User & Authentication → Email, Phone, Username
   - Enable "Email verification code"
   - Enable "Password reset"

---

## 📋 Quick Checklist

Before testing:
- [ ] Code changes saved
- [ ] App restarted (fresh build)
- [ ] Console logs visible
- [ ] Test email accessible
- [ ] Clerk dashboard configured

During test:
- [ ] Email entered
- [ ] "Forgot Password?" clicked
- [ ] Alert shows "Reset Code Sent"
- [ ] Email received
- [ ] Code entered
- [ ] New password entered
- [ ] "Reset Password" clicked
- [ ] Success alert shown
- [ ] Signed in automatically

---

## 🎯 Expected Timeline

- Request code: < 2 seconds
- Receive email: 5-30 seconds
- Enter code: user action
- Reset password: < 2 seconds
- Sign in: < 1 second

**Total:** ~1 minute from start to signed in

---

## ✅ If Test Passes

Your password reset is working! Proceed to:
1. Archive Build 5
2. Upload to TestFlight
3. Test on physical device

---

## ❌ If Test Fails

Share the console output, especially:
- `[Password Reset] Available methods on signIn:`
- `[Password Reset] Supported factors:`
- Any error messages

I'll help debug further!

---

*Quick test guide - December 5, 2025*





