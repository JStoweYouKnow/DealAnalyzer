# 🔧 Fix: Apple 403 Forbidden Error

## Error
```
Apple 403 detected - Access forbidden.
This request is forbidden for security reasons - The API key in use does not allow this request
```

## Common Causes & Solutions

### 1. **App-Specific Password Required (Most Common)**

If you have 2FA enabled on your Apple ID, you **must** use an App-Specific Password, not your regular password.

**Solution:**
1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Go to **Security** → **App-Specific Passwords**
4. Click **Generate Password**
5. Name it "EAS Submit" or similar
6. Copy the generated password (it will look like: `abcd-efgh-ijkl-mnop`)
7. Use this password when EAS prompts for your Apple ID password

### 2. **Insufficient Permissions**

Your Apple ID might not have the right role in App Store Connect.

**Required Roles:**
- **App Manager** (minimum)
- **Admin** (recommended)

**Check your role:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access**
3. Find your Apple ID
4. Verify you have **App Manager** or **Admin** role

**If you don't have access:**
- Ask the account owner to grant you **App Manager** or **Admin** access
- Or use the account owner's credentials

### 3. **Wrong Apple ID**

Make sure you're using the Apple ID that has access to the app in App Store Connect.

**Verify:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Check which Apple ID is associated with your app
3. Use that exact Apple ID

### 4. **App Store Connect API Key (Alternative Method)**

Instead of using Apple ID credentials, you can use an App Store Connect API key:

**Create API Key:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Click **Generate API Key** (+ button)
4. Name it "EAS Submit"
5. Select **App Manager** or **Admin** role
6. Download the `.p8` key file (you can only download once!)
7. Note the **Key ID** and **Issuer ID**

**Use API Key with EAS:**
```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

When prompted, choose to use API key instead of Apple ID.

### 5. **Team ID Mismatch**

Make sure the Team ID matches your Apple Developer account.

**Find your Team ID:**
1. Go to [developer.apple.com](https://developer.apple.com)
2. Sign in
3. Go to **Account** → **Membership**
4. Copy the **Team ID** (10 characters)

**Verify in App Store Connect:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Go to **Users and Access**
3. Check the Team ID matches

## Recommended Solution

**Try this in order:**

1. **Use App-Specific Password** (if 2FA enabled)
   - Generate at [appleid.apple.com](https://appleid.apple.com)
   - Use it when prompted for password

2. **Verify App Store Connect Access**
   - Make sure your Apple ID has **App Manager** or **Admin** role
   - Check in App Store Connect → Users and Access

3. **Use API Key Method** (Most Reliable)
   - Create API key in App Store Connect
   - Use it with EAS submit command

## Quick Test

Try submitting again with App-Specific Password:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

When prompted for password, use your **App-Specific Password** (not your regular password).

## Still Having Issues?

If none of these work:
1. Check if the app exists in App Store Connect
2. Verify the bundle ID matches: `com.comfortfinder.dealanalyzer`
3. Make sure you're using the correct Apple Developer account
4. Try using the account owner's credentials (if you're not the owner)

