/**
 * Global error handlers to prevent app crashes from unhandled errors.
 * These handlers log errors and prevent them from crashing the app.
 */

let handlersSetup = false;

export function setupGlobalErrorHandlers() {
  if (handlersSetup) {
    return;
  }
  
  // Handle unhandled promise rejections
  const originalHandler = (global as any).onunhandledrejection;
  (global as any).onunhandledrejection = (event: any) => {
    console.warn('[CrashPrevention] Unhandled Promise Rejection:', event?.reason || event);
    
    // Call original handler if it exists
    if (originalHandler) {
      originalHandler(event);
    }
    
    // Prevent the default behavior (which might crash the app)
    if (event?.preventDefault) {
      event.preventDefault();
    }
  };
  
  // Handle uncaught errors
  const originalErrorHandler = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
    console.warn('[CrashPrevention] Global Error:', error?.message || error);
    console.warn('[CrashPrevention] Is Fatal:', isFatal);
    
    if (__DEV__) {
      console.warn('[CrashPrevention] Stack:', error?.stack);
    }
    
    // For non-fatal errors, don't crash the app
    if (!isFatal) {
      return;
    }
    
    // For fatal errors, call the original handler
    // This will show the red screen in dev or crash in production
    if (originalErrorHandler) {
      originalErrorHandler(error, isFatal);
    }
  });
  
  handlersSetup = true;
  console.log('[CrashPrevention] Global error handlers initialized');
}

/**
 * Wrap an async function to catch and log errors without crashing.
 */
export function safeAsync<T>(
  fn: () => Promise<T>,
  fallback?: T,
  errorContext?: string
): Promise<T | undefined> {
  return fn().catch((error) => {
    console.warn(`[CrashPrevention] ${errorContext || 'Async error'}:`, error?.message || error);
    return fallback;
  });
}
