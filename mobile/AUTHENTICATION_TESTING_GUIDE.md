# Authentication Testing Guide

## Current Status
The app is configured with:
- **Clerk Instance**: Production (`pk_live_Y2xlcmsuY29tZm9ydGZpbmRlci5wcm9qY29tZm9ydC5jb20k`)
- **Environment**: Live production Clerk backend
- **All fixes applied**: Build 6 includes all auth improvements

## Testing Scenarios

### Scenario 1: Existing Account - Sign In
**For emails that already have accounts in Clerk:**

1. Launch the app
2. You should see the Sign In screen
3. Enter your existing email and password
4. Tap "Sign In"

**Expected Results:**
- ✅ If credentials correct: Signs in successfully, navigates to app
- ❌ If password wrong: Shows "Incorrect password" with "Reset Password" button
- ❌ If account doesn't exist: Shows "Account not found" with "Sign Up" button

**Common Issues:**
- **"Account not found"**: The email doesn't exist in THIS Clerk instance (production)
  - Solution: Check Clerk dashboard to verify email exists
  - Or sign up with a new account
- **"Incorrect password"**: Password is wrong for this account
  - Solution: Use "Reset Password" flow (see Scenario 3)

---

### Scenario 2: New Account - Sign Up
**For emails that DON'T have accounts yet:**

1. Launch the app
2. Tap "Don't have an account? Sign up"
3. Enter email, username, password, confirm password
4. Tap "Sign Up"

**Expected Results:**
- ✅ New account: Sends verification email, shows code entry screen
- ❌ Email exists: Shows alert "Account Already Exists" with "Sign In" button
- ❌ Username taken: Shows "This username is already taken"

**If Email Already Exists:**
- Alert will offer two options:
  1. "Sign In" - Takes you to sign-in screen
  2. "Cancel" - Stay on sign-up to try different email

---

### Scenario 3: Password Reset
**For accounts where you forgot the password:**

1. On Sign In screen, enter your email
2. Tap "Forgot Password?"
3. Clerk sends a 6-digit code to your email
4. Enter the code
5. Enter new password (8+ characters)
6. Confirm new password
7. Tap "Reset Password"

**Expected Results:**
- ✅ Success: "Password reset successful! You are now signed in."
- ❌ Invalid code: "Invalid verification code"
- ❌ Code expired: "Verification code has expired"

**Common Issues:**
- **Code not received**: Check spam folder, or check Clerk dashboard email settings
- **Code invalid**: Make sure you're entering the most recent code (6 digits)
- **Password too short**: Must be 8+ characters

---

## Quick Test Plan

### Step 1: Verify Your Existing Accounts
1. Go to Clerk Dashboard → Users
2. Check which emails exist in your production instance
3. Note down:
   - Email addresses that exist
   - Whether they have passwords set
   - Whether email is verified

### Step 2: Test Sign In (Existing Account)
Use an email you confirmed exists in Clerk:
- [ ] Sign in with correct password → Should work
- [ ] Sign in with wrong password → Should show "Reset Password" option
- [ ] Sign in with non-existent email → Should show "Sign Up" option

### Step 3: Test Sign Up (New Account)
Use a NEW email not in Clerk:
- [ ] Sign up with new email → Should send verification code
- [ ] Enter verification code → Should create account and sign in
- [ ] Try to sign up again with same email → Should offer "Sign In" instead

### Step 4: Test Password Reset
Use an existing account:
- [ ] Enter email, tap "Forgot Password?"
- [ ] Check email for code (check spam if needed)
- [ ] Enter code and new password → Should reset and sign in

---

## Troubleshooting

### "I can't sign in with my email"
**Check:**
1. Does the email exist in Clerk dashboard?
2. Are you using the correct password?
3. Is the account verified?
4. Are you in the right Clerk instance (production)?

**Solutions:**
- If account doesn't exist → Sign up
- If password wrong → Use "Reset Password"
- If email not verified → Check email for verification link

### "Sign up says email already exists"
**This means:**
- An account with this email already exists in Clerk
- You should sign in instead of signing up

**Solutions:**
1. Tap "Sign In" when the alert appears
2. Or tap "Already have an account? Sign in" link
3. If you forgot password → Use "Reset Password" flow

### "I'm not receiving verification codes"
**Check:**
1. Spam/junk folder
2. Clerk dashboard → Email settings → Verify email provider configured
3. Check email address is spelled correctly
4. Wait 1-2 minutes (sometimes delayed)

**Solutions:**
- Tap "Resend Code" (if available)
- Check Clerk dashboard email logs
- Try a different email provider (Gmail, etc.)

### "The app shows a blank/white screen"
**This was the hooks error - should be fixed in Build 6**

**If still happening:**
1. Check console logs for errors
2. Verify Clerk key is correct in app.json
3. Check network connectivity

---

## Expected Behavior Summary

| Situation | What Should Happen |
|-----------|-------------------|
| Email exists, correct password | ✅ Sign in successful |
| Email exists, wrong password | ❌ Show "Incorrect password" + "Reset" button |
| Email doesn't exist | ❌ Show "Account not found" + "Sign Up" button |
| Sign up with existing email | ❌ Show "Already exists" + "Sign In" button |
| Sign up with new email | ✅ Send verification code |
| Reset password with code | ✅ Reset and auto sign in |
| Invalid reset code | ❌ Show "Invalid code" error |

---

## Testing Checklist

Complete this checklist with your specific test emails:

### Test Email 1: ____________________
- [ ] Exists in Clerk? Yes / No
- [ ] Can sign in? Yes / No / Error: ________
- [ ] Can reset password? Yes / No / Error: ________

### Test Email 2: ____________________
- [ ] Exists in Clerk? Yes / No
- [ ] Can sign in? Yes / No / Error: ________
- [ ] Can sign up (if new)? Yes / No / Error: ________

### Test Email 3: ____________________
- [ ] Exists in Clerk? Yes / No
- [ ] Can sign in? Yes / No / Error: ________
- [ ] Can sign up (if new)? Yes / No / Error: ________

---

## Next Steps After Testing

### If Everything Works:
1. Archive Build 6
2. Upload to TestFlight
3. Distribute to testers
4. ✅ Authentication is working!

### If Issues Remain:
Document the specific error:
1. Which email did you try?
2. What action (sign in / sign up / reset)?
3. What error message appeared?
4. Screenshot if possible

Then we can debug the specific issue.

---

*Testing guide created: December 5, 2025*
*Build: 6 (with all auth fixes)*

