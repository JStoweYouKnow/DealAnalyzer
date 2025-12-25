import Redis from 'ioredis';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import { NextRequest, NextResponse } from 'next/server';

// Lazy Redis client initialization to avoid connection attempts at module load
let redis: Redis | null = null;
let warnedRedisUnavailable = false;

/**
 * Get Redis client instance, initializing it only when env vars are present.
 * Returns null if Redis credentials are missing (no connection attempt is made).
 */
function getRedis(): Redis | null {
  if (redis !== null) {
    return redis;
  }

  const redisUrl = process.env.REDIS_URL?.trim();
  const redisHost = process.env.REDIS_HOST?.trim();
  const redisPort = process.env.REDIS_PORT?.trim();
  const redisPassword = process.env.REDIS_PASSWORD?.trim();

  // Support both REDIS_URL and individual host/port/password configs
  if (redisUrl) {
    try {
      redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true, // Don't connect immediately
      });

      // Handle connection errors
      redis.on('error', (err) => {
        console.warn('[Rate Limit] Redis connection error:', err.message);
      });

      return redis;
    } catch (error: any) {
      console.warn('[Rate Limit] Failed to create Redis client from URL:', {
        error: error?.message || String(error),
      });
      return null;
    }
  } else if (redisHost) {
    try {
      redis = new Redis({
        host: redisHost,
        port: redisPort ? parseInt(redisPort, 10) : 6379,
        password: redisPassword || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        lazyConnect: true,
      });

      redis.on('error', (err) => {
        console.warn('[Rate Limit] Redis connection error:', err.message);
      });

      return redis;
    } catch (error: any) {
      console.warn('[Rate Limit] Failed to create Redis client:', {
        error: error?.message || String(error),
      });
      return null;
    }
  }

  return null;
}

// Module-scoped cached singletons for rate limiters
let cachedGeneralRateLimit: RateLimiterRedis | null = null;
let cachedExpensiveRateLimit: RateLimiterRedis | null = null;
let cachedStrictRateLimit: RateLimiterRedis | null = null;

// Module-scoped pending promises to coordinate concurrent initialization
let cachedGeneralRateLimitPromise: Promise<RateLimiterRedis | null> | null = null;
let cachedExpensiveRateLimitPromise: Promise<RateLimiterRedis | null> | null = null;
let cachedStrictRateLimitPromise: Promise<RateLimiterRedis | null> | null = null;

// Lazy rate limiters - only created when Redis is available, cached after first creation
async function getGeneralRateLimit(): Promise<RateLimiterRedis | null> {
  if (cachedGeneralRateLimit !== null) {
    return cachedGeneralRateLimit;
  }

  if (cachedGeneralRateLimitPromise !== null) {
    return await cachedGeneralRateLimitPromise;
  }

  cachedGeneralRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedGeneralRateLimitPromise = null;
      return null;
    }

    try {
      // Ensure connection is established
      await redisClient.connect();

      const instance = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rlflx:general',
        points: 100, // Number of requests
        duration: 60, // Per 60 seconds (1 minute)
      });

      cachedGeneralRateLimit = instance;
      cachedGeneralRateLimitPromise = null;
      return instance;
    } catch (error: any) {
      console.warn('[Rate Limit] Failed to instantiate general rate limiter:', {
        error: error?.message || String(error),
      });
      cachedGeneralRateLimitPromise = null;
      return null;
    }
  })();

  return await cachedGeneralRateLimitPromise;
}

async function getExpensiveRateLimit(): Promise<RateLimiterRedis | null> {
  if (cachedExpensiveRateLimit !== null) {
    return cachedExpensiveRateLimit;
  }

  if (cachedExpensiveRateLimitPromise !== null) {
    return await cachedExpensiveRateLimitPromise;
  }

  cachedExpensiveRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedExpensiveRateLimitPromise = null;
      return null;
    }

    try {
      await redisClient.connect();

      // Use different limits for development vs production
      const isDevelopment = process.env.NODE_ENV === 'development';
      const points = isDevelopment ? 100 : 30; // 100/min in dev, 30/min in prod

      const instance = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rlflx:expensive',
        points, // Requests per duration
        duration: 60, // 60 seconds (1 minute)
      });

      cachedExpensiveRateLimit = instance;
      cachedExpensiveRateLimitPromise = null;
      return instance;
    } catch (error: any) {
      console.warn('[Rate Limit] Failed to instantiate expensive rate limiter:', {
        error: error?.message || String(error),
      });
      cachedExpensiveRateLimitPromise = null;
      return null;
    }
  })();

  return await cachedExpensiveRateLimitPromise;
}

async function getStrictRateLimit(): Promise<RateLimiterRedis | null> {
  if (cachedStrictRateLimit !== null) {
    return cachedStrictRateLimit;
  }

  if (cachedStrictRateLimitPromise !== null) {
    return await cachedStrictRateLimitPromise;
  }

  cachedStrictRateLimitPromise = (async () => {
    const redisClient = getRedis();
    if (!redisClient) {
      cachedStrictRateLimitPromise = null;
      return null;
    }

    try {
      await redisClient.connect();

      const instance = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: 'rlflx:strict',
        points: 5, // 5 requests per minute for very expensive operations
        duration: 60,
      });

      cachedStrictRateLimit = instance;
      cachedStrictRateLimitPromise = null;
      return instance;
    } catch (error: any) {
      console.warn('[Rate Limit] Failed to instantiate strict rate limiter:', {
        error: error?.message || String(error),
      });
      cachedStrictRateLimitPromise = null;
      return null;
    }
  })();

  return await cachedStrictRateLimitPromise;
}

// Export getter functions for backward compatibility
export async function generalRateLimit(): Promise<RateLimiterRedis | null> {
  return await getGeneralRateLimit();
}

export async function expensiveRateLimit(): Promise<RateLimiterRedis | null> {
  return await getExpensiveRateLimit();
}

export async function strictRateLimit(): Promise<RateLimiterRedis | null> {
  return await getStrictRateLimit();
}

/**
 * Determines if we're behind a trusted proxy (e.g., Vercel, Cloudflare, etc.)
 * Only use forwarded headers when behind a trusted proxy to prevent spoofing
 */
function isTrustedProxy(): boolean {
  if (process.env.TRUSTED_PROXY === 'true') {
    return true;
  }

  if (process.env.VERCEL === '1') {
    return true;
  }

  if (process.env.VERCEL_ENV === 'production' || process.env.VERCEL_ENV === 'preview') {
    return true;
  }

  return false;
}

/**
 * Gets the client identifier for rate limiting
 * Prioritizes authenticated user ID, falls back to IP address
 */
function getIdentifier(
  request: NextRequest,
  userId: string | null | undefined
): string {
  if (userId) {
    return `user:${userId}`;
  }

  if (isTrustedProxy()) {
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }

    if (realIp) {
      return realIp.trim();
    }
  }

  return 'unknown';
}

/**
 * Helper function to get authenticated user ID from Clerk
 */
async function getAuthenticatedUserId(request: NextRequest): Promise<string | null> {
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch (error) {
    // Clerk not available or not configured
  }
  return null;
}

// Rate limit middleware wrapper
export async function withRateLimit(
  request: NextRequest,
  limiterGetter: (() => Promise<RateLimiterRedis | null> | RateLimiterRedis | null) | RateLimiterRedis = generalRateLimit,
  handler: (request: NextRequest) => Promise<NextResponse>,
  userId?: string | null
): Promise<NextResponse> {
  // Get the limiter
  const limiterResult = typeof limiterGetter === 'function'
    ? limiterGetter()
    : limiterGetter;

  const limiter = limiterResult instanceof Promise
    ? await limiterResult
    : limiterResult;

  // Skip rate limiting if Redis is not available
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

  // Wrap rate limit check in try-catch with timeout
  let rateLimitResult: RateLimiterRes;
  try {
    // Add timeout to prevent hanging on network failures (3 second timeout)
    const limitPromise = limiter.consume(identifier, 1);
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Rate limit check timeout')), 3000)
    );

    rateLimitResult = await Promise.race([limitPromise, timeoutPromise]);
  } catch (error: any) {
    // Check if this is a rate limit rejection (not an error)
    if (error instanceof RateLimiterRes) {
      // Rate limit exceeded
      const msBeforeNext = error.msBeforeNext;
      const retryAfterSeconds = Math.ceil(msBeforeNext / 1000);

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: retryAfterSeconds,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limiter.points.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + msBeforeNext).toISOString(),
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // If rate limiting fails (e.g., network error), fail open
    const errorMessage = error?.message || error?.cause?.message || String(error);
    const errorCode = error?.code || error?.cause?.code;

    console.warn('[Rate Limit] Rate limiting check failed, allowing request:', {
      error: errorMessage,
      errorCode: errorCode,
    });

    // Check for network errors
    const isNetworkError =
      errorCode === 'ENOTFOUND' ||
      errorCode === 'ECONNREFUSED' ||
      errorCode === 'ETIMEDOUT' ||
      errorMessage.includes('timeout') ||
      errorMessage.includes('connection');

    if (isNetworkError) {
      // Clear cached limiters
      cachedGeneralRateLimit = null;
      cachedExpensiveRateLimit = null;
      cachedStrictRateLimit = null;
      cachedGeneralRateLimitPromise = null;
      cachedExpensiveRateLimitPromise = null;
      cachedStrictRateLimitPromise = null;
      redis = null;
      warnedRedisUnavailable = false;
    }

    return handler(request);
  }

  // Add rate limit headers to successful responses
  const response = await handler(request);
  response.headers.set('X-RateLimit-Limit', limiter.points.toString());
  response.headers.set('X-RateLimit-Remaining', rateLimitResult.remainingPoints.toString());
  response.headers.set('X-RateLimit-Reset', new Date(Date.now() + rateLimitResult.msBeforeNext).toISOString());

  return response;
}

// Export getRedis for external use if needed
export { getRedis };
