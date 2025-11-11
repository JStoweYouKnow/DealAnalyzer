import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Create Redis client - will use UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN from env
// If not configured, will gracefully fail and allow requests through
let redis: Redis | null = null;

type RateLimitTier = 'general' | 'expensive' | 'strict';

const rateLimiters: Record<RateLimitTier, Ratelimit | null> = {
  general: null,
  expensive: null,
  strict: null,
};

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    // Configure documented rate limiting tiers
    rateLimiters.general = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '60 s'),
      analytics: true,
    });
    rateLimiters.expensive = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
    });
    rateLimiters.strict = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, '60 s'),
      analytics: true,
    });
  }
} catch (error) {
  console.warn('Rate limiting not configured - requests will not be rate limited');
}

export const RATE_LIMIT_TIERS: Record<RateLimitTier, Ratelimit | null> = rateLimiters;

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
function getRateLimitIdentifier(
  request: Request,
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
 * Rate limit middleware for API routes
 *
 * Usage:
 * ```typescript
 * import { checkRateLimit } from '@/lib/rate-limit';
 * import { auth } from '@clerk/nextjs/server'; // or your app-specific auth helper
 *
 * export async function POST(request: Request) {
 *   // Get authenticated user ID using your app-specific authentication helper
 *   // For Clerk with Next.js: const { userId } = await auth();
 *   // For other auth systems: obtain userId from your auth provider
 *   const authResult = await auth();
 *   const userId = authResult?.userId ?? null;
 *   
 *   const rateLimitResult = await checkRateLimit(request, 'general', userId);
 *   if (!rateLimitResult.success) {
 *     return rateLimitResult.response;
 *   }
 *   // ... rest of handler
 * }
 * ```
 *
 * Note: Callers must supply an explicit userId parameter (or null/undefined if unauthenticated).
 * The rate limiter works with generic Request objects and does not perform authentication itself.
 * If userId is provided, rate limiting will be per-user. If not provided (or null/undefined),
 * rate limiting will fall back to IP-based identification.
 */
export async function checkRateLimit(
  request: Request,
  tier: RateLimitTier = 'general',
  userId?: string | null
): Promise<{
  success: boolean;
  response?: Response;
}> {
  // If rate limiting is not configured, allow the request through
  const ratelimit = rateLimiters[tier];

  if (!ratelimit) {
    return { success: true };
  }

  // Get identifier for rate limiting (prioritizes userId, falls back to IP)
  const identifier = getRateLimitIdentifier(request, userId);

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

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
