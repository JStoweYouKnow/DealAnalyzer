# 🔧 Fix: API Key 403 Forbidden Error

## Error
```
Apple 403 detected - Access forbidden.
This request is forbidden for security reasons - The API key in use does not allow this request
```

## Common Causes & Solutions

### 1. **API Key Permissions (Most Common)**

The API key might not have the right role or permissions.

**Check in App Store Connect:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Find your API key (ID: `GSVL7LHKOXLM`)
4. Check the **Role** - it should be:
   - ✅ **App Manager** (minimum)
   - ✅ **Admin** (recommended)

**If the role is wrong:**
- You cannot change the role of an existing API key
- You need to **revoke** the current key and **create a new one** with the correct role

### 2. **API Key Doesn't Have Access to the App**

The API key might not have access to your specific app.

**Verify:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Find your API key (ID: `GSVL7LHKOXLM`)
4. Check if it's associated with your app
5. If not, you may need to create a new key or grant access

### 3. **Wrong .p8 File or File Path**

The `.p8` file might be incorrect or in the wrong location.

**Verify:**
1. Check the file exists: `ls -la /Users/v/Downloads/DealAnalyzer/mobile/asc-api-key.p8`
2. Verify it's the correct file (matches the key ID `GSVL7LHKOXLM`)
3. Check the file path in `eas.json` is correct: `"./asc-api-key.p8"`

### 4. **API Key Expired or Revoked**

The API key might have been revoked or expired.

**Check:**
1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Find your API key (ID: `GSVL7LHKOXLM`)
4. Check if it shows as **Active** or **Revoked**

### 5. **Bundle ID Mismatch**

The API key might not have access to the bundle ID you're trying to submit.

**Verify:**
- Your bundle ID: `com.comfortfinder.dealanalyzer`
- The app exists in App Store Connect with this bundle ID
- The API key has access to this app

## Recommended Solution

### Step 1: Create a New API Key with Correct Permissions

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Click **Generate API Key** (+ button)
4. Name it "EAS Submit"
5. **IMPORTANT**: Select **App Manager** or **Admin** role
6. Click **Generate**
7. **Download the .p8 file immediately** (you can only download once!)
8. Note the **Key ID** and **Issuer ID**

### Step 2: Update Configuration

Update `eas.json` with the new key:

```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyId": "NEW_KEY_ID",
      "ascApiKeyIssuerId": "adb920a3-6abd-4ddd-a30e-58e8ac2d28a5",
      "ascApiKeyPath": "./asc-api-key.p8"
    }
  }
}
```

### Step 3: Replace the .p8 File

1. Delete the old `asc-api-key.p8` file
2. Place the new `.p8` file in the `mobile` directory
3. Name it `asc-api-key.p8`

### Step 4: Revoke Old Key (Optional)

If you created a new key, you can revoke the old one:
1. Go to App Store Connect → Users and Access → Keys
2. Find the old key (ID: `GSVL7LHKOXLM`)
3. Click **Revoke**

## Alternative: Use Apple ID Credentials

If API key continues to fail, you can use Apple ID credentials instead:

1. Remove the API key configuration from `eas.json`
2. Use App-Specific Password (if 2FA enabled)
3. Submit interactively:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

## Quick Checklist

- [ ] API key has **App Manager** or **Admin** role
- [ ] API key is **Active** (not revoked)
- [ ] `.p8` file exists and is correct
- [ ] File path in `eas.json` is correct
- [ ] App exists in App Store Connect
- [ ] Bundle ID matches: `com.comfortfinder.dealanalyzer`
- [ ] API key has access to the app

## Next Steps

1. **Check the API key role** in App Store Connect
2. If role is wrong, **create a new API key** with **App Manager** or **Admin** role
3. Update `eas.json` with the new Key ID
4. Replace the `.p8` file
5. Try submitting again

