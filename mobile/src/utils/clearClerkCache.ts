import * as SecureStore from 'expo-secure-store';
import { useClerk } from '@clerk/clerk-expo';

/**
 * Clear all Clerk-related data from SecureStore
 * This will force the user to sign in again
 */
export async function clearClerkCache(): Promise<void> {
  try {
    console.log('[Clear Cache] Starting to clear Clerk cache...');
    
    // Clerk stores tokens with keys like:
    // - __clerk_db_jwt
    // - __clerk_client_jwt
    // - __clerk_session_token
    // - And other keys prefixed with __clerk_
    
    // Get all possible Clerk keys
    const clerkKeys = [
      '__clerk_db_jwt',
      '__clerk_client_jwt',
      '__clerk_session_token',
      '__clerk_refresh_token',
      '__clerk_access_token',
    ];
    
    // Try to delete known Clerk keys
    for (const key of clerkKeys) {
      try {
        await SecureStore.deleteItemAsync(key);
        console.log(`[Clear Cache] Deleted ${key}`);
      } catch (error) {
        // Key might not exist, that's okay
        console.log(`[Clear Cache] Key ${key} not found or already deleted`);
      }
    }
    
    // Also clear user session ID if stored separately
    try {
      await SecureStore.deleteItemAsync('user-session-id');
      console.log('[Clear Cache] Deleted user-session-id');
    } catch (error) {
      console.log('[Clear Cache] user-session-id not found');
    }
    
    // Note: SecureStore doesn't have a "list all keys" method,
    // so we can't delete all Clerk keys automatically.
    // The above should cover most cases.
    
    console.log('[Clear Cache] ✅ Clerk cache cleared successfully');
  } catch (error) {
    console.error('[Clear Cache] ❌ Error clearing Clerk cache:', error);
    throw error;
  }
}

/**
 * Hook to clear Clerk cache and sign out
 * Use this in a component to provide a "Clear Cache" button
 */
export function useClearClerkCache() {
  const clerk = useClerk();
  
  const clearCache = async () => {
    try {
      // Sign out first (this clears some Clerk state)
      if (clerk) {
        await clerk.signOut();
        console.log('[Clear Cache] Signed out from Clerk');
      }
      
      // Then clear SecureStore
      await clearClerkCache();
      
      console.log('[Clear Cache] ✅ Cache cleared and signed out');
    } catch (error) {
      console.error('[Clear Cache] ❌ Error:', error);
      throw error;
    }
  };
  
  return { clearCache };
}

