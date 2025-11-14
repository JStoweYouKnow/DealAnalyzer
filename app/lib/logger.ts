/**
 * Optimized logging - no-op in production for better performance
 * Safe for client-side use in Next.js
 */

// Safely check NODE_ENV - works in both server and client contexts
const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';

export const logger = {
  log: isDevelopment ? console.log : () => {},
  error: console.error, // Always log errors
  warn: isDevelopment ? console.warn : () => {},
  info: isDevelopment ? console.info : () => {},
  debug: isDevelopment ? console.debug : () => {},
};

