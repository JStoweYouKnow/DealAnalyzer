# 🚀 Quick Start - Building for App Store

## ⚡ 5-Minute Production Build

Already set up production environment? Here's how to build:

```bash
# 1. Navigate to mobile directory
cd mobile

# 2. Build for iOS
eas build --platform ios --profile production

# 3. Build for Android
eas build --platform android --profile production

# 4. Submit to TestFlight (iOS)
eas submit --platform ios --profile production

# 5. Submit to Google Play (Android)
eas submit --platform android --profile production
```

---

## 📝 First Time Setup Checklist

Haven't set up production yet? Do this first:

### 1. Install Tools
```bash
npm install -g eas-cli
eas login
```

### 2. Configure Production Keys

Edit `eas.json`, replace these values:
```json
"EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_KEY",
"EXPO_PUBLIC_CONVEX_URL": "https://your-prod.convex.cloud",
"EXPO_PUBLIC_API_URL": "https://api.comfortfinder.com"
```

### 3. Update App Store Connect Info

In `eas.json` → `submit` → `production`:
```json
"appleId": "your-email@example.com",
"ascAppId": "1234567890",
"appleTeamId": "ABCD123456"
```

### 4. First Build
```bash
eas build:configure  # One-time setup
eas build --platform ios --profile production
```

---

## 🔑 Where to Get Keys

| Key | Where to Get It | Looks Like |
|-----|----------------|------------|
| **Clerk Production Key** | clerk.com → Production instance → API Keys | \`pk_live_...\` |
| **Convex Production URL** | convex.dev → Production deployment | \`https://xyz.convex.cloud\` |
| **API URL** | Your deployed backend | \`https://api.yoursite.com\` |
| **App Store Connect App ID** | appstoreconnect.apple.com → App Information | 10-digit number |
| **Apple Team ID** | developer.apple.com → Membership | 10-character code |

---

## ⚠️ Common Issues

### "Invalid publishable key"
- Make sure you're using \`pk_live_\` for production (not \`pk_test_\`)
- Check for typos in \`eas.json\`

### "Build failed: credentials error"
- Run \`eas credentials\` to configure iOS/Android signing
- For first build, choose "Generate new credentials"

### "App rejected: Privacy Policy"
- Verify URLs are accessible:
  - https://comfort-finder-analyzer.vercel.app/privacy.html
  - https://comfort-finder-analyzer.vercel.app/terms.html

---

## 📱 Test Your Build

### iOS (via TestFlight):
1. Build completes → Get IPA file URL
2. \`eas submit --platform ios\`
3. Go to App Store Connect → TestFlight
4. Add testers via email
5. They receive TestFlight invitation

### Android (via Internal Testing):
1. Build completes → Get AAB file URL
2. \`eas submit --platform android\`
3. Go to Google Play Console → Internal Testing
4. Add testers via email
5. They receive Play Store link

---

## 🎯 Pre-Submission Checklist

Before hitting "Submit for Review":

- [ ] Tested on real iOS device
- [ ] Tested on real Android device
- [ ] All features working (login, analysis, upload)
- [ ] No crashes or major bugs
- [ ] Screenshots uploaded (3+ for iOS, 2+ for Android)
- [ ] App description written
- [ ] Privacy Policy URL added
- [ ] Age rating selected
- [ ] Support email configured

---

## 📚 Full Documentation

- **Detailed Setup**: [SETUP_FOR_APP_STORE.md](./SETUP_FOR_APP_STORE.md)
- **Full Evaluation**: [../APP_STORE_READINESS.md](../APP_STORE_READINESS.md)
- **Changes Made**: [../FIXES_COMPLETED.md](../FIXES_COMPLETED.md)

---

**Ready to build?** Run \`eas build --platform ios --profile production\` 🚀
