# 🔧 Fix: Sign-Up Crash

## Issue Found
The app was crashing during sign-up due to a **Rules of Hooks violation**.

## Problem
In `SignUpScreen.tsx`, line 31 was calling `useAuth()` inside a `useEffect` hook:
```typescript
useEffect(() => {
  const auth = useAuth(); // ❌ WRONG - Hooks can't be called inside effects!
  // ...
}, []);
```

**This violates React's Rules of Hooks** and causes the app to crash.

## Fix Applied
✅ Removed the invalid `useAuth()` call from inside the `useEffect`
✅ The `useAuth()` hook is already called at the top level of the component (line 21)

## What Changed
- **Before**: `useAuth()` was called both at top level AND inside `useEffect` ❌
- **After**: `useAuth()` is only called at the top level ✅

## Next Steps

### 1. Rebuild the App
Since this is a code change, you need to create a new build:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
eas build --profile production --platform ios
```

### 2. Test in TestFlight
After the new build is installed:
1. Open the TestFlight app
2. Try to sign up again
3. The crash should be fixed

### 3. Alternative: Test Locally First
If you want to test the fix before rebuilding:

```bash
cd /Users/v/Downloads/DealAnalyzer/mobile
npx expo start --clear
```

Then test sign-up in Expo Go or your development build.

## Why This Caused a Crash

React's Rules of Hooks state:
- ✅ Hooks must be called at the **top level** of a component
- ❌ Hooks **cannot** be called inside:
  - `useEffect`, `useCallback`, `useMemo`
  - Conditionals (`if` statements)
  - Loops
  - Nested functions

Calling `useAuth()` inside `useEffect` violates this rule and causes React to throw an error, crashing the app.

## Verification

After rebuilding, the sign-up flow should:
1. ✅ Not crash when opening the sign-up screen
2. ✅ Allow you to enter email, username, and password
3. ✅ Submit the sign-up form successfully
4. ✅ Handle email verification if required
5. ✅ Sign you in after successful verification

## Additional Notes

The fix is minimal and safe - we just removed the duplicate hook call. All the functionality remains the same, but now it follows React's rules correctly.

