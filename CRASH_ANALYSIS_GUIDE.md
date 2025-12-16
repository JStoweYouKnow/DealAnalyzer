# 🔍 iOS Crash Analysis Guide

**App:** TheComfortFinder (com.comfortfinder.dealanalyzer)
**App ID:** 6756039028

---

## 📥 Step 1: Get the Crash Logs

### Method 1: Xcode Organizer
```bash
# Open Organizer
open -a Xcode
# Then: Window → Organizer → Crashes
```

### Method 2: Click the URL
```
xcode://organizer/crashes/downloadPoint?adamId=6756039028&...
```

### Method 3: App Store Connect
- https://appstoreconnect.apple.com
- My Apps → TheComfortFinder → TestFlight → Crashes

---

## 🔎 Step 2: Export Crash Report

Once in Xcode Organizer:

1. **Select the crash** from the list
2. **Right-click** → "Show in Finder" or "Export"
3. **Save** the `.crash` file
4. **Share** it here for analysis

---

## 🛠️ Common iOS Crash Causes & Fixes

### 1. Memory Issues
**Symptoms:**
- Crash type: `EXC_BAD_ACCESS`, `SIGSEGV`
- Memory warnings in logs

**Fixes:**
```javascript
// Check for memory leaks
// Use React DevTools Profiler
// Optimize image loading
```

### 2. JavaScript Errors
**Symptoms:**
- Crash in JavaScriptCore
- RedBox errors not caught

**Fixes:**
```javascript
// Add error boundaries
import { ErrorBoundary } from 'react-error-boundary';

// Catch unhandled promises
global.Promise = Promise;
Promise.onPossiblyUnhandledRejection = (error) => {
  console.error('Unhandled promise rejection:', error);
};
```

### 3. Native Module Crashes
**Symptoms:**
- Crash in specific library (Stripe, Clerk, expo-*)
- Happens on specific actions

**Fixes:**
- Check library versions
- Update to latest stable
- Add try-catch around native calls

### 4. Clerk Authentication Issues
**Symptoms:**
- Crash on sign-in/sign-up
- WebView related crashes

**Check:**
```bash
# Verify Clerk keys in app
grep -r "CLERK_PUBLISHABLE_KEY" mobile/
```

### 5. API/Network Crashes
**Symptoms:**
- Crash when making requests
- Related to axios/fetch

**Fix:**
```typescript
// Add global error handler
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);
```

---

## 📋 Crash Report Checklist

When you have the crash report, check:

- [ ] **Exception Type** (EXC_BAD_ACCESS, EXC_CRASH, etc.)
- [ ] **Crashed Thread** stack trace
- [ ] **Library causing crash** (top of stack trace)
- [ ] **iOS version** affected
- [ ] **Device models** affected
- [ ] **App version** with crash
- [ ] **Frequency** (how often it happens)

---

## 🔧 Debugging Commands

### View local crash logs:
```bash
# Device crash logs (if you have device connected)
xcrun simctl diagnose

# Or find in:
~/Library/Logs/DiagnosticReports/
```

### Symbolicate crash logs:
```bash
cd /Users/v/Documents/DealAnalyzer/mobile

# If you have .crash file
symbolicatecrash TheComfortFinder.crash \
  ~/Desktop/TheComfortFinder.xcarchive/dSYMs \
  > symbolicated.crash
```

### Check dSYMs are uploaded:
- App Store Connect → TestFlight → Build → "Include Symbols"
- Should be "Yes" for symbolicated crashes

---

## 🚨 Emergency Fixes

### If crashes are widespread:

1. **Remove build from TestFlight:**
   - App Store Connect → TestFlight → Select Build
   - Expire Beta Testing

2. **Push hotfix:**
   ```bash
   # Fix the crash
   # Increment version
   # Build and upload new version
   ./quick-archive.sh
   ```

3. **Monitor in real-time:**
   - Use Sentry or Crashlytics for better crash reporting
   
---

## 📨 Share Crash Report

To get help analyzing:

1. Export crash from Organizer
2. Share the `.crash` file contents
3. Or copy the stack trace text

I can help identify the issue and provide specific fixes!

---

## 🎯 Next Steps

1. **Open the crash report** using the URL
2. **Export the crash log**
3. **Share it** for analysis
4. **I'll identify the root cause**
5. **Implement the fix**
6. **Upload new build**

