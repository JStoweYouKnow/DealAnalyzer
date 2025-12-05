# Pre-Upload Checklist - The Comfort Finder

## ✅ Quick Status Check

Run this checklist before uploading to ensure everything is ready.

---

## 1. Files & Configuration

- [x] **ASC API Key**: `asc-api-key.p8` ✅ Found
- [x] **App Icons**: Present in `assets/` ✅
- [x] **Bundle ID**: `com.comfortfinder.dealanalyzer` ✅
- [x] **Version**: 1.0.0 ✅
- [x] **EAS Config**: `eas.json` configured ✅
- [x] **Swift Header**: Fixed ✅

---

## 2. App Store Connect Setup

Visit: https://appstoreconnect.apple.com

- [ ] App record created (App ID: 6756039028)
- [ ] App name reserved: "The Comfort Finder"
- [ ] Primary language set
- [ ] SKU entered
- [ ] Bundle ID matched: `com.comfortfinder.dealanalyzer`

---

## 3. App Information Required

### Basic Info
- [ ] App Name: "The Comfort Finder"
- [ ] Subtitle (30 chars max)
- [ ] Privacy Policy URL: _________________
- [ ] Support URL: _________________
- [ ] Marketing URL (optional): _________________

### Description
- [ ] App Description written (4000 chars max)
- [ ] Keywords optimized (100 chars max, comma-separated)
- [ ] Promotional Text (170 chars, can be updated anytime)

### Category
- [ ] Primary Category: _______ (Suggested: Business or Productivity)
- [ ] Secondary Category (optional): _______

### Age Rating
- [ ] Age rating questionnaire completed

---

## 4. Screenshots Required

You need screenshots for these sizes:

### iPhone
- [ ] 6.9" Display (iPhone 16 Pro Max) - 1320 x 2868 px
- [ ] 6.7" Display (iPhone 15 Pro Max) - 1290 x 2796 px
- [ ] 6.5" Display (iPhone 14 Plus) - 1284 x 2778 px
- [ ] 5.5" Display (iPhone 8 Plus) - 1242 x 2208 px

### iPad (if supporting tablets)
- [ ] 12.9" Display (iPad Pro) - 2048 x 2732 px
- [ ] 11" Display (iPad Pro) - 1668 x 2388 px

**Tip**: You need 3-10 screenshots per device size. Take them using iOS Simulator or actual devices.

---

## 5. App Icon Checklist

Required sizes (all should be in `Images.xcassets/AppIcon.appiconset/`):

- [ ] 1024x1024 (App Store)
- [ ] 180x180 (iPhone)
- [ ] 167x167 (iPad Pro)
- [ ] 152x152 (iPad)
- [ ] 120x120 (iPhone)
- [ ] 87x87 (iPhone)
- [ ] 80x80 (iPad)
- [ ] 76x76 (iPad)
- [ ] 60x60 (iPhone)
- [ ] 58x58 (iPhone)
- [ ] 40x40 (iPhone/iPad)
- [ ] 29x29 (iPhone/iPad)
- [ ] 20x20 (iPhone/iPad)

---

## 6. Legal & Compliance

- [ ] Privacy Policy created and hosted
- [ ] Terms of Service (if applicable)
- [ ] GDPR compliance (if serving EU users)
- [ ] COPPA compliance (if app is for children)
- [ ] Export Compliance: ✅ Already set to NO encryption

---

## 7. Testing Checklist

Test on actual devices before submission:

- [ ] App launches successfully
- [ ] All core features work
- [ ] No crashes or freezes
- [ ] Camera/photo permissions work
- [ ] Document upload works
- [ ] PDF parsing works
- [ ] Authentication works (Clerk)
- [ ] Data syncs properly (Convex)
- [ ] All screens render correctly
- [ ] Navigation works smoothly
- [ ] Stripe payments work (if applicable)

---

## 8. Environment Variables

Verify production environment in `eas.json`:

- [x] `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Live key set ✅
- [x] `EXPO_PUBLIC_CONVEX_URL`: Production URL set ✅
- [x] `EXPO_PUBLIC_API_URL`: Production URL set ✅

---

## 9. Pricing & Availability

- [ ] Price tier selected (Free or Paid)
- [ ] Countries/regions selected
- [ ] Release date set (Manual or Automatic)

---

## 10. App Review Information

Prepare for App Store Review team:

- [ ] Demo account credentials (if login required)
- [ ] Special instructions for reviewers
- [ ] Contact information for emergencies

---

## 11. Build Settings

Check your `Info.plist`:

- [x] Display Name: "The Comfort Finder" ✅
- [x] Version: 1.0.0 ✅
- [x] Build: 1 ✅
- [x] Minimum iOS: 12.0 ✅
- [x] Camera permission description ✅
- [x] Photo library permission description ✅

---

## 12. Common Rejection Reasons to Avoid

- [ ] App doesn't crash on launch
- [ ] All features are functional
- [ ] Privacy policy is accessible
- [ ] Permissions have clear descriptions
- [ ] No placeholder content
- [ ] No broken links
- [ ] App description matches functionality
- [ ] Screenshots show actual app content
- [ ] No references to other platforms (Android, etc.)

---

## Ready to Upload?

### Option A: Quick Upload (Recommended)

```bash
cd mobile
./upload-to-appstore.sh
```

Select option 1 for full build + submit.

### Option B: Manual EAS

```bash
cd mobile
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

### Option C: Xcode

```bash
cd mobile
./upload-to-appstore.sh
```

Select option 4 to open in Xcode.

---

## After Submission

1. **Wait for Processing** (15-60 minutes)
   - You'll receive email when build is processed
   
2. **Complete App Store Connect**
   - Add all required information
   - Select your build
   - Submit for review

3. **Review Process** (24-48 hours typically)
   - Monitor status in App Store Connect
   - Respond to any questions from review team

4. **Release**
   - Choose manual or automatic release
   - App goes live!

---

## Support

- **EAS Docs**: https://docs.expo.dev/build/introduction/
- **App Store Connect**: https://appstoreconnect.apple.com
- **Apple Developer**: https://developer.apple.com/support/

---

## Notes

- Build number must increment for each submission
- Version number follows semantic versioning (MAJOR.MINOR.PATCH)
- Keep your ASC API key (`asc-api-key.p8`) secure and never commit to git

Good luck! 🚀

