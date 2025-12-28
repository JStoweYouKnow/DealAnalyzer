# 🔑 App Store Connect API Key Setup

## API Key ID
✅ **Key ID**: `GSVL7LHKOXLM`

## Next Steps

### 1. Get Your Issuer ID

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Click **Users and Access** → **Keys** tab
3. Find your API key (the one with ID `GSVL7LHKOXLM`)
4. Copy the **Issuer ID** (it's a UUID like `12345678-1234-1234-1234-123456789012`)

### 2. Place Your .p8 Key File

1. Make sure you have the `.p8` key file downloaded (you can only download it once!)
2. Place it in the `mobile` directory
3. Name it `asc-api-key.p8`

**File location:**
```
/Users/v/Downloads/DealAnalyzer/mobile/asc-api-key.p8
```

### 3. Update eas.json

I've already added the Key ID to `eas.json`. You need to:

1. **Add your Issuer ID** - Replace `YOUR_ISSUER_ID` in `eas.json` with your actual Issuer ID
2. **Verify the path** - Make sure `asc-api-key.p8` is in the `mobile` directory

### 4. Final eas.json Configuration

Your `eas.json` should look like this:

```json
"submit": {
  "production": {
    "ios": {
      "ascApiKeyId": "GSVL7LHKOXLM",
      "ascApiKeyIssuerId": "12345678-1234-1234-1234-123456789012",
      "ascApiKeyPath": "./asc-api-key.p8"
    }
  }
}
```

### 5. Submit to TestFlight

Once configured, submit:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas submit --platform ios --latest
```

It should now use the API key automatically without prompting for credentials!

## Security Note

⚠️ **Important**: 
- The `.p8` file contains sensitive credentials
- Add `asc-api-key.p8` to `.gitignore` to prevent committing it
- Never share this file publicly

## Troubleshooting

### "Key file not found"
- Make sure `asc-api-key.p8` is in the `mobile` directory
- Check the file path in `eas.json` matches the actual location

### "Invalid Issuer ID"
- Double-check the Issuer ID from App Store Connect
- Make sure there are no extra spaces or characters

### "Invalid Key ID"
- Verify the Key ID `GSVL7LHKOXLM` is correct
- Check it matches the key in App Store Connect

