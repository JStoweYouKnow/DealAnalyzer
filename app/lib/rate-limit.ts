import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Lazy Redis client initialization to avoid connection attempts at module load
let redis: Redis | null = null;
let warnedRedisUnavailable = false;

/**
 * Get Redis client instance, initializing it only when both env vars are present.
 * Returns null if Redis credentials are missing (no connection attempt is made).
 */
function getRedis(): Redis | null {
  if (redis !== null) {
    return redis;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

  if (!url || !token) {
    return null;
  }

  redis = new Redis({
    url,
    token,
  });

  return redis;
}

// Module-scoped cached singletons for rate limiters
let cachedGeneralRateLimit: Ratelimit | null = null;
let cachedExpensiveRateLimit: Ratelimit | null = null;
let cachedStrictRateLimit: Ratelimit | null = null;

// Module-scoped pending promises to coordinate concurrent initialization
let cachedGeneralRateLimitPromise: Promise<Ratelimit | null> | null = null;
let cachedExpensiveRateLimitPromise: Promise<Ratelimit | null> | null = null;
let cachedStrictRateLimitPromise: Promise<Ratelimit | null> | null = null;

// Lazy rate limiters - only created when Redis is available, cached after first creation
// Uses async pattern with pending promises to prevent race conditions
async function getGeneralRateLimit(): Promise<Ratelimit | null> {
  // If instance exists, return it
  if (cachedGeneralRateLimit !== null) {
    return cachedGeneralRateLimit;
  }
  
  // If pending promise exists, await it and return the resolved instance
  if (cachedGeneralRateLimitPromise !== null) {
    return await cachedGeneralRateLimitPromise;
  }
  
  // Otherwise, create and assign a new pending promise
  cachedGeneralRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedGeneralRateLimitPromise = null;
      return null;
    }
    
    try {
      const instance = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
        analytics: true,
        prefix: '@upstash/ratelimit/general',
      });
      
      // Assign the cached instance on success
      cachedGeneralRateLimit = instance;
      cachedGeneralRateLimitPromise = null;
      return instance;
    } catch (error) {
      console.error('Failed to instantiate general rate limiter:', error);
      // Clear the pending promise on error
      cachedGeneralRateLimitPromise = null;
      return null;
    }
  })();
  
  return await cachedGeneralRateLimitPromise;
}

async function getExpensiveRateLimit(): Promise<Ratelimit | null> {
  // If instance exists, return it
  if (cachedExpensiveRateLimit !== null) {
    return cachedExpensiveRateLimit;
  }
  
  // If pending promise exists, await it and return the resolved instance
  if (cachedExpensiveRateLimitPromise !== null) {
    return await cachedExpensiveRateLimitPromise;
  }
  
  // Otherwise, create and assign a new pending promise
  cachedExpensiveRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedExpensiveRateLimitPromise = null;
      return null;
    }
    
    try {
      const instance = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute for expensive operations
        analytics: true,
        prefix: '@upstash/ratelimit/expensive',
      });
      
      // Assign the cached instance on success
      cachedExpensiveRateLimit = instance;
      cachedExpensiveRateLimitPromise = null;
      return instance;
    } catch (error) {
      console.error('Failed to instantiate expensive rate limiter:', error);
      // Clear the pending promise on error
      cachedExpensiveRateLimitPromise = null;
      return null;
    }
  })();
  
  return await cachedExpensiveRateLimitPromise;
}

async function getStrictRateLimit(): Promise<Ratelimit | null> {
  // If instance exists, return it
  if (cachedStrictRateLimit !== null) {
    return cachedStrictRateLimit;
  }
  
  // If pending promise exists, await it and return the resolved instance
  if (cachedStrictRateLimitPromise !== null) {
    return await cachedStrictRateLimitPromise;
  }
  
  // Otherwise, create and assign a new pending promise
  cachedStrictRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedStrictRateLimitPromise = null;
      return null;
    }
    
    try {
      const instance = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute for very expensive operations
        analytics: true,
        prefix: '@upstash/ratelimit/strict',
      });
      
      // Assign the cached instance on success
      cachedStrictRateLimit = instance;
      cachedStrictRateLimitPromise = null;
      return instance;
    } catch (error) {
      console.error('Failed to instantiate strict rate limiter:', error);
      // Clear the pending promise on error
      cachedStrictRateLimitPromise = null;
      return null;
    }
  })();
  
  return await cachedStrictRateLimitPromise;
}

// Export getter functions for backward compatibility
export async function generalRateLimit(): Promise<Ratelimit | null> {
  return await getGeneralRateLimit();
}

export async function expensiveRateLimit(): Promise<Ratelimit | null> {
  return await getExpensiveRateLimit();
}

export async function strictRateLimit(): Promise<Ratelimit | null> {
  return await getStrictRateLimit();
}

/**
 * Determines if we're behind a trusted proxy (e.g., Vercel, Cloudflare, etc.)
 * Only use forwarded headers when behind a trusted proxy to prevent spoofing
 */
function isTrustedProxy(): boolean {
  // Check for explicit trusted proxy flag (allows manual override)
  if (process.env.TRUSTED_PROXY === 'true') {
    return true;
  }
  
  // Check if running on Vercel (Vercel is a trusted proxy)
  // Vercel sets VERCEL=1 in production and preview deployments
  if (process.env.VERCEL === '1') {
    return true;
  }
  
  // Check for other trusted proxy indicators
  // Next.js on Vercel also sets VERCEL_ENV
  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
    return true;
  }
  
  // In development, be conservative - don't trust forwarded headers by default
  // Users can set TRUSTED_PROXY=true if they're behind a trusted proxy in dev
  return false;
}

/**
 * Gets the client identifier for rate limiting
 * Prioritizes authenticated user ID, falls back to IP address
 * Only uses forwarded headers when behind a trusted proxy
 */
function getIdentifier(
  request: NextRequest,
  userId: string | null | undefined
): string {
  // Prioritize authenticated user ID
  if (userId) {
    return `user:${userId}`;
  }
  
  // Fall back to IP address
  // Only use forwarded headers if we're behind a trusted proxy
  if (isTrustedProxy()) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    
    if (forwardedFor) {
      // Take the first IP in the chain (the original client IP)
      return forwardedFor.split(',')[0].trim();
    }
    
    if (realIp) {
      return realIp.trim();
    }
  }
  
  // If not behind a trusted proxy or headers not available,
  // we can't reliably get the IP from headers (they're spoofable)
  // Return 'unknown' as a safe fallback
  // In production behind a trusted proxy, this should rarely happen
  return 'unknown';
}

/**
 * Helper function to get authenticated user ID from Clerk
 * Returns null if not authenticated or Clerk is not available
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch (error) {
    // Clerk not available or not configured, continue without user ID
  }
  return null;
}

// Rate limit middleware wrapper
export async function withRateLimit(
  request: NextRequest,
  limiterGetter: (() => Promise<Ratelimit | null> | Ratelimit | null) | Ratelimit = generalRateLimit,
  handler: (request: NextRequest) => Promise<NextResponse>,
  userId?: string | null
): Promise<NextResponse> {
  // Get the limiter (support both function and direct instance for backward compatibility)
  // Functions can now return either Promise<Ratelimit | null> or Ratelimit | null
  const limiterResult = typeof limiterGetter === 'function' 
    ? limiterGetter() 
    : limiterGetter;
  
  // Await if it's a promise, otherwise use directly
  const limiter = limiterResult instanceof Promise
    ? await limiterResult
    : limiterResult;

  // Skip rate limiting if Redis is not available (fallback to no-op limiter)
  if (!limiter) {
    if (!warnedRedisUnavailable) {
      warnedRedisUnavailable = true;
      console.warn('Rate limiting disabled: Redis not available');
    }
    return handler(request);
  }

  // Get authenticated user ID if not provided
  const authenticatedUserId = userId !== undefined 
    ? userId 
    : await getAuthenticatedUserId(request);
  
  const identifier = getIdentifier(request, authenticatedUserId);
  const { success, limit, remaining, reset } = await limiter.limit(identifier);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: Math.ceil((reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': new Date(reset).toISOString(),
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  // Add rate limit headers to successful responses
  const response = await handler(request);
  response.headers.set('X-RateLimit-Limit', limit.toString());
  response.headers.set('X-RateLimit-Remaining', remaining.toString());
  response.headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

  return response;
}

// Export getRedis for external use if needed
export { getRedis };

