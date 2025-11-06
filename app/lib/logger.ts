/**
 * Optimized logging - no-op in production for better performance
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: isDevelopment ? console.log : () => {},
  error: console.error, // Always log errors
  warn: isDevelopment ? console.warn : () => {},
  info: isDevelopment ? console.info : () => {},
  debug: isDevelopment ? console.debug : () => {},
};

