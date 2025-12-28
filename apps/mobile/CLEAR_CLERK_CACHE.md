# Clear Clerk User Cache

## Quick Methods

### Method 1: Clear via Account Screen (Recommended)

I've added a utility function you can use. Add this to your AccountScreen:

```typescript
import { useClearClerkCache } from '../utils/clearClerkCache';

// In your component:
const { clearCache } = useClearClerkCache();

// Add a button:
<TouchableOpacity onPress={async () => {
  Alert.alert(
    'Clear Cache',
    'This will sign you out and clear all cached data. Continue?',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearCache();
            Alert.alert('Success', 'Cache cleared. Please sign in again.');
          } catch (error) {
            Alert.alert('Error', 'Failed to clear cache.');
          }
        },
      },
    ]
  );
}}>
  <Text>Clear Cache & Sign Out</Text>
</TouchableOpacity>
```

### Method 2: Clear via Terminal (Development)

If you're in development and want to clear cache programmatically:

```bash
# This requires adding a debug command to your app
# Or use React Native Debugger to call the function
```

### Method 3: Clear via Clerk Dashboard

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Select your application
3. Go to **Users** → Find your user
4. Click on the user
5. Go to **Sessions** tab
6. Click **Revoke** on all active sessions
7. This will force the user to sign in again

### Method 4: Uninstall and Reinstall App (Most Thorough)

1. Uninstall the app from your device
2. Reinstall it
3. All SecureStore data will be cleared
4. User will need to sign in again

### Method 5: Clear SecureStore Manually (iOS Simulator)

If using iOS Simulator:

```bash
# Reset simulator
xcrun simctl erase all

# Or reset specific simulator
xcrun simctl erase <device-id>
```

## What Gets Cleared

When you clear Clerk cache, the following is removed:

- ✅ Clerk JWT tokens (`__clerk_db_jwt`, `__clerk_client_jwt`, etc.)
- ✅ Session tokens (`__clerk_session_token`)
- ✅ Refresh tokens (`__clerk_refresh_token`)
- ✅ User session ID (`user-session-id`)
- ✅ Clerk session state

## What Doesn't Get Cleared

- ❌ User account in Clerk (still exists in database)
- ❌ Gmail OAuth tokens (stored in Convex database, not SecureStore)
- ❌ Other app data (stored separately)

## When to Clear Cache

Clear cache when:
- Testing authentication flows
- User reports "stuck" authentication state
- Switching between test and production Clerk instances
- Debugging authentication issues
- User needs to sign in with a different account

## Testing After Clearing

After clearing cache:
1. App should show sign-in screen
2. User will need to sign in again
3. All queries should refetch with new session
4. Gmail status should check with new user context

## Implementation

The utility function is available at:
- `mobile/src/utils/clearClerkCache.ts`

You can import and use it anywhere in your app:

```typescript
import { clearClerkCache, useClearClerkCache } from '../utils/clearClerkCache';

// Direct function call
await clearClerkCache();

// Or use the hook
const { clearCache } = useClearClerkCache();
await clearCache(); // This also signs out
```

