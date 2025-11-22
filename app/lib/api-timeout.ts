/**
 * API timeout utilities
 * Provides timeout functionality for external API calls to prevent hanging requests
 */

export class TimeoutError extends Error {
  constructor(message: string = 'Request timeout') {
    super(message);
    this.name = 'TimeoutError';
  }
}

/**
 * Creates a promise that rejects after a specified timeout
 */
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new TimeoutError(`Request timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @returns The result of the promise or throws TimeoutError
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  return Promise.race([
    promise,
    createTimeoutPromise(timeoutMs),
  ]);
}

/**
 * Default timeout values for different types of operations
 */
export const TIMEOUTS = {
  // Quick API calls (geocoding, simple lookups)
  QUICK: 5000, // 5 seconds
  
  // Standard API calls (property analysis, data fetching)
  STANDARD: 30000, // 30 seconds
  
  // Long-running operations (file processing, PDF generation)
  LONG: 60000, // 60 seconds
  
  // Very long operations (batch processing)
  VERY_LONG: 120000, // 2 minutes
} as const;

/**
 * Creates a fetch request with timeout
 * @param url The URL to fetch
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds (default: 30 seconds)
 * @returns Fetch response
 */
export async function fetchWithTimeout(
  url: string | URL,
  options: RequestInit = {},
  timeoutMs: number = TIMEOUTS.STANDARD
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new TimeoutError(`Fetch request timed out after ${timeoutMs}ms`);
    }
    throw error;
  }
}

/**
 * Creates an axios-like request with timeout
 * Useful for external HTTP libraries
 */
export function createTimeoutWrapper<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  timeoutMs: number = TIMEOUTS.STANDARD
): T {
  return ((...args: Parameters<T>) => {
    return withTimeout(fn(...args), timeoutMs);
  }) as T;
}

