import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';

// Lazy Redis client initialization to avoid connection attempts at module load
let redis: Redis | null = null;

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

// Lazy rate limiters - only created when Redis is available
function getGeneralRateLimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) {
    return null;
  }
  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
    analytics: true,
    prefix: '@upstash/ratelimit/general',
  });
}

function getExpensiveRateLimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) {
    return null;
  }
  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute for expensive operations
    analytics: true,
    prefix: '@upstash/ratelimit/expensive',
  });
}

function getStrictRateLimit(): Ratelimit | null {
  const redisClient = getRedis();
  if (!redisClient) {
    return null;
  }
  return new Ratelimit({
    redis: redisClient,
    limiter: Ratelimit.slidingWindow(5, '1 m'), // 5 requests per minute for very expensive operations
    analytics: true,
    prefix: '@upstash/ratelimit/strict',
  });
}

// Export getter functions for backward compatibility
export function generalRateLimit(): Ratelimit | null {
  return getGeneralRateLimit();
}

export function expensiveRateLimit(): Ratelimit | null {
  return getExpensiveRateLimit();
}

export function strictRateLimit(): Ratelimit | null {
  return getStrictRateLimit();
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
  limiterGetter: (() => Ratelimit | null) | Ratelimit = generalRateLimit,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get the limiter (support both function and direct instance for backward compatibility)
  const limiter = typeof limiterGetter === 'function' 
    ? limiterGetter() 
    : limiterGetter;

  // Skip rate limiting if Redis is not available (fallback to no-op limiter)
  if (!limiter) {
    console.warn('Rate limiting disabled: Redis not available');
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

