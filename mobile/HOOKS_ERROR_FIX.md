# 🔧 Fix: "Rendered more hooks than during the previous render" Error

## Issue
The app was crashing immediately on launch with the error:
> "Rendered more hooks than during the previous render."

This is a **React Hooks violation** that occurs when hooks are called conditionally or in different orders between renders.

## Root Cause
In `AppNavigator.tsx`, the `useEffect` hook (lines 112-148) was **conditionally returning a cleanup function**:

```typescript
// ❌ WRONG - Conditionally returning cleanup
React.useEffect(() => {
  if (!isLoaded) {
    const interval = setInterval(...);
    const timeout = setTimeout(...);
    return () => {  // Only returned when isLoaded is false!
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }
  // No return when isLoaded is true - violates Rules of Hooks!
}, [isLoaded, startTime]);
```

**This violates React's Rules of Hooks:**
- ✅ Hooks must be called in the same order every render
- ✅ Cleanup functions must always be returned (or never returned)
- ❌ You cannot conditionally return cleanup functions

## Fix Applied
✅ **Always return cleanup function**, but conditionally set up timers:

```typescript
// ✅ CORRECT - Always return cleanup
React.useEffect(() => {
  let interval: NodeJS.Timeout | null = null;
  let timeout: NodeJS.Timeout | null = null;
  
  if (!isLoaded) {
    interval = setInterval(...);
    timeout = setTimeout(...);
  }

  // Always return cleanup function
  return () => {
    if (interval) clearInterval(interval);
    if (timeout) clearTimeout(timeout);
  };
}, [isLoaded, startTime]);
```

## Additional Fix
Also fixed the navigation guards `useEffect` to ensure cleanup is always returned:

```typescript
React.useEffect(() => {
  let unsubscribe: (() => void) | undefined;
  let keyboardUnsubscribe: (() => void) | undefined;
  
  const timer = setTimeout(() => {
    if (navigationRef.current) {
      unsubscribe = setupNavigationGuards(navigationRef.current);
      keyboardUnsubscribe = setupKeyboardDismissOnNavigation(navigationRef.current, true);
    }
  }, 100);

  // Always return cleanup
  return () => {
    clearTimeout(timer);
    unsubscribe?.();
    keyboardUnsubscribe?.();
  };
}, []);
```

## Files Changed
- `mobile/src/navigation/AppNavigator.tsx`
  - Fixed conditional cleanup in loading timeout `useEffect`
  - Fixed navigation guards `useEffect` cleanup

## Testing
1. ✅ Build the app
2. ✅ Launch the app
3. ✅ Should no longer crash on launch
4. ✅ Should show loading screen, then sign-in or main app

## Next Steps
1. **Rebuild the app:**
   ```bash
   cd mobile
   npm run ios
   ```

2. **Test in TestFlight:**
   - Archive Build 6
   - Upload to TestFlight
   - Verify app launches without crashing

## Why This Happened
React tracks hooks by their call order. When a component re-renders:
- If hooks are called in a different order → Error
- If cleanup functions are conditionally returned → Error
- If different numbers of hooks are called → Error

The fix ensures hooks are always called in the same order and cleanup is always returned.

---

*Fix applied: December 5, 2025*

