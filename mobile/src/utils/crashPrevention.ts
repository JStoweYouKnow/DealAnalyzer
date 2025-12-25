/**
 * Crash Prevention & Error Handling Utilities
 * Add this to your app to catch and log errors before they cause crashes
 */

// Global error handler for unhandled promise rejections
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled promise rejections
  const originalPromiseRejection = Promise.prototype.catch;
  
  if (typeof Promise !== 'undefined') {
    // @ts-ignore
    global.Promise.onPossiblyUnhandledRejection = (error: Error) => {
      // Use console.warn to prevent React Native error overlay
      console.warn('[Crash Prevention] ⚠️ Unhandled Promise Rejection:', error?.message || error);
      if (__DEV__) {
        console.warn('[Crash Prevention] Stack:', error?.stack);
      }
      // TODO: Send to error tracking service (Sentry, etc.)
    };
  }

  // Handle global errors
  if (typeof ErrorUtils !== 'undefined') {
    // @ts-ignore
    ErrorUtils.setGlobalHandler((error: Error, isFatal: boolean) => {
      // Use console.warn to prevent React Native error overlay
      console.warn('[Crash Prevention] ⚠️ Global Error:', error?.message || error);
      console.warn('[Crash Prevention] Is Fatal:', isFatal);
      if (__DEV__) {
        console.warn('[Crash Prevention] Stack:', error?.stack);
      }
      
      if (isFatal) {
        // Log critical error before crash (still use warn to prevent overlay)
        console.warn('[Crash Prevention] ⚠️ FATAL ERROR - App may crash');
        // TODO: Send to error tracking service
      }
    });
  }
};

// Safe async wrapper
export const safeAsync = async <T>(
  fn: () => Promise<T>,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.warn('[Crash Prevention] ⚠️ Async error caught:', error);
    return fallback;
  }
};

// Safe native module call wrapper
export const safeNativeCall = async <T>(
  fn: () => Promise<T>,
  moduleName: string,
  fallback?: T
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.warn(`[Crash Prevention] ⚠️ Native module error (${moduleName}):`, error);
    // Alert user if needed
    return fallback;
  }
};

// Memory management helper
export const cleanupImages = () => {
  // Force garbage collection of cached images
  if (global.gc) {
    global.gc();
  }
};

// Network error handler
export const handleNetworkError = (error: any) => {
  if (error.code === 'NETWORK_ERROR' || !navigator.onLine) {
    console.warn('Network error - app is offline');
    return { error: 'No internet connection', offline: true };
  }
  
  if (error.response?.status === 401) {
    console.warn('Unauthorized - token may be expired');
    // Handle token refresh
  }
  
  return { error: error.message };
};






