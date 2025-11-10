import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client - will use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
// If not configured, will gracefully fail and allow requests through
let redis: Redis | null = null;
let ratelimit: Ratelimit | null = null;

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Configure rate limiting: 10 requests per 60 seconds
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
    });
  }
} catch (error) {
  console.warn('Rate limiting not configured - requests will not be rate limited');
}

/**
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit';
 *
 * export async function POST(request: Request) {
 *   const rateLimitResult = await checkRateLimit(request);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   // ... rest of handler
 * }
 * ```
 */
export async function checkRateLimit(request: Request): Promise<{
  success: boolean;
  response?: Response;
}> {
  // If rate limiting is not configured, allow the request through
  if (!ratelimit) {
    return { success: true };
  }

  // Get IP address from request headers
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(ip);

    if (!success) {
      return {
        success: false,
        response: new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            limit,
            remaining: 0,
            reset: new Date(reset).toISOString(),
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': reset.toString(),
              'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
            },
          }
        ),
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // On error, allow the request through (fail open)
    return { success: true };
  }
}
