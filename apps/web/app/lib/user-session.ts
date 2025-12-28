/**
 * Browser-based user session management
 *
 * IMPORTANT: This provides basic data isolation between different browsers/devices,
 * but is NOT secure authentication. Data is separated by a browser-generated ID.
 *
 * For production use with multiple users, implement proper authentication
 * (e.g., Clerk, Auth0, NextAuth.js, etc.)
 */

const USER_SESSION_KEY = 'dealanalyzer_user_session_id';

/**
 * Get or create a unique session ID for this browser
 * This ID persists across page refreshes but is unique per browser
 */
export function getUserSessionId(): string {
  if (typeof window === 'undefined') {
    // Server-side: return a temporary ID that will be replaced client-side
    return 'temp-ssr-id';
  }

  try {
    // Check if we already have a session ID
    let sessionId = localStorage.getItem(USER_SESSION_KEY);

    if (!sessionId) {
      // Generate a new unique session ID
      // Format: usersession_{timestamp}_{random}
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 15) +
                     Math.random().toString(36).substring(2, 15);
      sessionId = `usersession_${timestamp}_${random}`;

      // Store it
      localStorage.setItem(USER_SESSION_KEY, sessionId);
      console.log('Created new user session ID:', sessionId);
    }

    return sessionId;
  } catch (error) {
    console.error('Failed to get/create user session ID:', error);
    // Fallback to a session-only ID (won't persist across refreshes)
    return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Clear the current session ID (for privacy/logout)
 * WARNING: This will make all previously saved email deals inaccessible
 */
export function clearUserSession(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(USER_SESSION_KEY);
    console.log('Cleared user session ID');
  } catch (error) {
    console.error('Failed to clear user session ID:', error);
  }
}

/**
 * Check if the user has an established session
 */
export function hasUserSession(): boolean {
  if (typeof window === 'undefined') return false;

  try {
    return localStorage.getItem(USER_SESSION_KEY) !== null;
  } catch (error) {
    return false;
  }
}
