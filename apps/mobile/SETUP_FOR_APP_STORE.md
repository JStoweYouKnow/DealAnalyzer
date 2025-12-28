# 🚀 App Store Setup Guide

## ✅ CRITICAL BLOCKERS - FIXED!

All 3 critical blockers have been resolved:

### ✅ Blocker #1: Hardcoded API Keys - FIXED
- **What was fixed**: Removed all hardcoded keys from `app.json`
- **How it works now**: Keys loaded from `eas.json` environment variables
- **Status**: ✅ **SAFE FOR SUBMISSION**

### ✅ Blocker #2: EAS Build Configuration - FIXED
- **What was created**: `eas.json` with development, preview, and production profiles
- **What you can do now**: Build production apps for App Store submission
- **Status**: ✅ **READY TO BUILD**

### ✅ Blocker #3: Legal Documents - FIXED
- **What was created**:
  - Privacy Policy at `/public/privacy.html`
  - Terms of Service at `/public/terms.html`
- **Status**: ✅ **COMPLIANT**

---

## 📋 NEXT STEPS TO APP STORE SUBMISSION

### Step 1: Set Up Production Environment (Required Before Building)

#### 1.1 Create Production Clerk Instance

1. Go to https://clerk.com dashboard
2. Click "Create Application" → Choose "Production"
3. Configure:
   - App name: "The Comfort Finder"
   - Authentication methods: Email, Google (recommended)
4. Copy your **Production** publishable key (starts with `pk_live_...`)

#### 1.2 Create Production Convex Instance

1. Go to https://convex.dev dashboard
2. Create new production deployment
3. Run in your main project (not mobile):
   ```bash
   npx convex deploy --prod
   ```
4. Copy your production URL (e.g., `https://your-prod.convex.cloud`)

#### 1.3 Update Production Configuration

Edit `mobile/eas.json`, find the `production` section, and replace:

```json
"production": {
  "env": {
    "EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY": "pk_live_YOUR_ACTUAL_PRODUCTION_KEY",
    "EXPO_PUBLIC_CONVEX_URL": "https://your-prod-deployment.convex.cloud",
    "EXPO_PUBLIC_API_URL": "https://api.comfortfinder.com"
  },
  ...
}
```

**IMPORTANT**:
- Use **pk_live_** for production (not pk_test_)
- Use your production Convex URL
- Use your production API domain

---

### Step 2: Install EAS CLI and Configure Project

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to your Expo account (create one at expo.dev if needed)
eas login

# Navigate to mobile directory
cd mobile

# Configure the project (interactive setup)
eas build:configure
```

During `eas build:configure`, you'll be asked:
- **Would you like to automatically create an EAS project?** → Yes
- This will update `app.json` with your EAS project ID

---

### Step 3: Set Up Apple Developer Account (iOS)

#### 3.1 Create Apple Developer Account
1. Go to https://developer.apple.com
2. Enroll in Apple Developer Program ($99/year)
3. Complete enrollment process (can take 24-48 hours)

#### 3.2 Create App in App Store Connect
1. Go to https://appstoreconnect.apple.com
2. Click "My Apps" → "+" → "New App"
3. Fill in:
   - Platform: iOS
   - Name: The Comfort Finder
   - Primary Language: English
   - Bundle ID: `com.comfortfinder.dealanalyzer`
   - SKU: `comfortfinder-dealanalyzer`
4. Save your App Store Connect App ID (found in App Information)

#### 3.3 Update eas.json with Apple Info

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "your-email@example.com",  // Your Apple ID email
      "ascAppId": "1234567890",              // From App Store Connect
      "appleTeamId": "ABCD123456"            // Found in Membership section
    }
  }
}
```

---

### Step 4: Set Up Google Play Developer Account (Android)

#### 4.1 Create Google Play Developer Account
1. Go to https://play.google.com/console
2. Pay one-time $25 registration fee
3. Complete account setup

#### 4.2 Create App in Google Play Console
1. Click "Create app"
2. Fill in:
   - App name: The Comfort Finder
   - Default language: English
   - App/Game: App
   - Free/Paid: (Your choice)
3. Accept declarations

#### 4.3 Set Up API Access (for automated submission)
1. In Google Play Console → Settings → API access
2. Create a service account
3. Grant "Release Manager" role
4. Download JSON key file
5. Save as `mobile/google-play-service-account.json`
6. **Add to .gitignore** (NEVER commit this file!)

```bash
echo "google-play-service-account.json" >> .gitignore
```

---

### Step 5: Create Store Assets

#### 5.1 App Icon (Required)
- **Size**: 1024x1024 pixels
- **Format**: PNG (no transparency)
- **Location**: Already at `mobile/assets/icon.png`
- **Action**: Verify it's 1024x1024 and looks professional

#### 5.2 Screenshots (Required)

**iOS - Minimum Required**:
```bash
# Install screenshot tool (optional but recommended)
npm install -g expo-cli

# Take screenshots from Simulator/Real Device:
# - iPhone 15 Pro Max (6.7")
# - iPhone 15 (6.1")
# - Minimum 3 screenshots showing key features
```

**Recommended Screenshots**:
1. Login/Authentication screen
2. Property analysis input screen
3. Property analysis results with metrics
4. Recent analyses dashboard
5. Market intelligence or comparison view

**Android - Minimum Required**:
- Minimum 2 screenshots
- Recommended 8 screenshots
- Phone size: 1080x1920 or 1440x2560

#### 5.3 Feature Graphic (Android Only)
- Size: 1024 x 500 pixels
- Format: PNG or JPEG
- Shows main features/branding

---

### Step 6: Write Store Listings

#### 6.1 App Store (iOS)

**Name** (30 chars max):
```
The Comfort Finder
```

**Subtitle** (30 chars max):
```
Real Estate Deal Analyzer
```

**Description** (4000 chars max):
```
Analyze real estate investment deals with AI-powered insights.

KEY FEATURES:
• AI-Powered Property Analysis
  Upload property listings via email, PDF, or manual input
  Get instant ROI, cash-on-cash return, and cap rate calculations

• Investment Criteria Matching
  Set your investment goals and criteria
  See which properties meet your requirements

• Deal Pipeline Management
  Track all potential deals in one place
  Organize by status (new, reviewed, analyzed)

• Mortgage Calculator
  Calculate monthly payments, total interest
  Compare financing scenarios

• Market Intelligence
  View recent analyses
  Compare multiple properties side-by-side

• Export Reports
  Generate professional PDF reports
  Share analyses with partners or lenders

Perfect for:
✓ Real estate investors
✓ House flippers
✓ Rental property owners
✓ Wholesalers
✓ Real estate agents

Stop using spreadsheets. Start making data-driven investment decisions.

DISCLAIMER: This app provides analytical tools only, not financial advice.
Always consult with licensed professionals before making investment decisions.
```

**Keywords** (100 chars max):
```
real estate,property,investment,analyzer,ROI,rental,deal,calculator,flip,cash flow
```

**Support URL**:
```
https://comfortfinder.com/support
```

**Marketing URL** (optional):
```
https://comfortfinder.com
```

**Privacy Policy URL** (REQUIRED):
```
https://comfort-finder-analyzer.vercel.app/privacy.html
```

#### 6.2 Google Play Store

**Short Description** (80 chars max):
```
AI-powered real estate investment analysis. Calculate ROI, cap rate, and more.
```

**Full Description** (4000 chars max):
- Use same content as iOS description above

**Category**:
- Finance or Business

---

### Step 7: Build Production Apps

#### 7.1 Build for iOS

```bash
cd mobile

# Build production iOS app
eas build --platform ios --profile production

# This will:
# - Upload your code to EAS servers
# - Build an IPA file for App Store
# - Takes 10-20 minutes
# - You'll get a download link when done
```

**First-time setup prompts**:
- Generate new iOS credentials? → Yes
- Use Apple ID for authentication? → Yes (easier)
  - Or manually create certificates (advanced)

#### 7.2 Build for Android

```bash
# Build production Android app
eas build --platform android --profile production

# This will:
# - Create an AAB (Android App Bundle)
# - Sign with generated keystore
# - Takes 10-15 minutes
```

**First-time setup prompts**:
- Generate new Android keystore? → Yes
- **CRITICAL**: Save the credentials shown! You'll need them for updates.

---

### Step 8: Test Production Builds

#### 8.1 iOS - TestFlight

```bash
# Submit to TestFlight (internal testing)
eas submit --platform ios --profile production

# Or download IPA and upload manually to App Store Connect
```

Then:
1. Go to App Store Connect → TestFlight
2. Add internal testers (up to 100)
3. Share with beta testers
4. Collect feedback
5. Fix any critical bugs

#### 8.2 Android - Internal Testing

```bash
# Submit to Google Play Internal Testing
eas submit --platform android --profile production
```

Then:
1. Go to Google Play Console → Testing → Internal testing
2. Create release
3. Upload AAB file
4. Add internal testers (email addresses)
5. Test thoroughly

---

### Step 9: Final Pre-Submission Checklist

Before submitting for review:

#### Technical:
- [ ] Built with production profile (`eas build --profile production`)
- [ ] Tested on real devices (iPhone & Android)
- [ ] All features working (login, analysis, upload, export)
- [ ] No crashes or major bugs
- [ ] Verified production API keys are being used
- [ ] Payment flow tested (if applicable)

#### Content:
- [ ] App icon is 1024x1024 and looks professional
- [ ] At least 3 iPhone screenshots (iOS) / 2 Android screenshots
- [ ] Feature graphic created (Android only)
- [ ] App description written and proofread
- [ ] Keywords optimized for search
- [ ] Support email set up (e.g., support@comfortfinder.com)

#### Legal:
- [ ] Privacy Policy published and URL added to listing
- [ ] Terms of Service published
- [ ] Age rating selected (likely 4+ or Everyone)
- [ ] Export compliance completed (usually "No" for most apps)
- [ ] Content rights declaration signed

#### App Store Specific (iOS):
- [ ] Screenshots for all required device sizes
- [ ] App Review Information filled out
- [ ] Demo account provided (if app requires login)
- [ ] Test notes for reviewers added

#### Google Play Specific (Android):
- [ ] Feature graphic uploaded
- [ ] Content rating questionnaire completed
- [ ] Target audience selected
- [ ] App category chosen

---

### Step 10: Submit for Review

#### iOS Submission:
1. Go to App Store Connect
2. Select your app → Version → "1.0"
3. Fill in "What's New" (version notes)
4. Upload screenshots (drag & drop)
5. Fill in all required fields
6. Click "Add for Review"
7. Answer App Review questions:
   - **Demo Account**: Provide test login if required
   - **Notes**: "First release. Property analysis tool for real estate investors."
8. Click "Submit for Review"

**Review Time**: 1-3 days typically
**Response Required**: Usually within 24-48 hours if issues found

#### Android Submission:
1. Go to Google Play Console
2. Production → Create new release
3. Upload AAB file
4. Fill in release notes
5. Review and roll out

**Review Time**: Few hours to 1 day typically

---

## 🎯 POST-SUBMISSION

### If Approved ✅
- Celebrate! 🎉
- Monitor reviews and ratings
- Respond to user feedback
- Plan next features

### If Rejected ❌
- Read rejection reason carefully
- Fix issues mentioned
- Resubmit within 48 hours
- Respond to reviewer in Resolution Center

Common rejection reasons:
- Missing demo account
- Privacy policy issues
- Crashes during testing
- Incomplete functionality
- Misleading screenshots

---

## 📞 SUPPORT RESOURCES

- **Expo EAS**: https://docs.expo.dev/build/introduction/
- **App Store Review**: https://developer.apple.com/app-store/review/
- **Google Play Policies**: https://play.google.com/console/about/guides/
- **Clerk Docs**: https://clerk.com/docs
- **Convex Docs**: https://docs.convex.dev

---

## 🔒 SECURITY REMINDERS

**NEVER commit to git**:
- `.env.production`
- `google-play-service-account.json`
- iOS certificates or provisioning profiles (EAS handles this)

**Add to .gitignore**:
```bash
*.env.production
google-play-service-account.json
*.p12
*.mobileprovision
```

---

## ⏱️ ESTIMATED TIMELINE

- **Week 1**: Apple/Google account setup, production environment
- **Week 2**: Create assets, write listings, build production apps
- **Week 3**: Internal testing, bug fixes, prepare submission
- **Week 4**: Submit and respond to review feedback

**Total**: 3-4 weeks to first public release

---

**Good luck with your App Store submission!** 🚀

If you have questions, refer to [APP_STORE_READINESS.md](../APP_STORE_READINESS.md) for the full evaluation.
