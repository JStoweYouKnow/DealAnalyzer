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

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

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

// Get client identifier (IP address or user ID)
function getIdentifier(request: NextRequest): string {
  // Try to get user ID from Clerk auth if available
  // For now, use IP address as fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// Rate limit middleware wrapper
export async function withRateLimit(
  request: NextRequest,
  limiterGetter: (() => Promise<Ratelimit | null> | Ratelimit | null) | Ratelimit = generalRateLimit,
  handler: (request: NextRequest) => Promise<NextResponse>
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

  const identifier = getIdentifier(request);
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

