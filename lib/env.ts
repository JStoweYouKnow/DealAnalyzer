import { z } from 'zod';

/**
 * Environment Variable Validation Schema
 *
 * This validates all required environment variables at startup,
 * preventing runtime errors from missing or invalid configuration.
 *
 * Usage: Import this file at the top of any API route or server component
 * that needs environment variables. It will throw an error if any required
 * variables are missing or invalid.
 */

const envSchema = z.object({
  // OpenAI API Key - Required for property extraction and analysis
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),

  // RentCast API Key - Required for rental market data
  RENTCAST_API_KEY: z.string().min(1, 'RENTCAST_API_KEY is required'),

  // ATTOM API Key - Required for property data and market intelligence
  ATTOM_API_KEY: z.string().min(1, 'ATTOM_API_KEY is required'),

  // Census API Key - Required for demographic data
  CENSUS_API_KEY: z.string().min(1, 'CENSUS_API_KEY is required'),

  // Convex Database URL - Optional (falls back to in-memory storage if not set)
  NEXT_PUBLIC_CONVEX_URL: z.preprocess((v) => v === '' ? undefined : v, z.string().url('NEXT_PUBLIC_CONVEX_URL must be a valid URL').optional()),

  // Clerk Authentication Keys - Required for user authentication
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1, 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is required'),
  CLERK_SECRET_KEY: z.string().min(1, 'CLERK_SECRET_KEY is required'),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Optional: Sentry Error Tracking
  NEXT_PUBLIC_SENTRY_DSN: z.preprocess((v) => v === '' ? undefined : v, z.string().url().optional()),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // Optional: Gmail OAuth (if using Gmail integration)
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.preprocess((v) => v === '' ? undefined : v, z.string().url().optional()),

  // Optional: Session Secret
  SESSION_SECRET: z.string().optional(),

  // Optional: Feature Flags
  FEATURE_ALLOW_PUBLIC_ROUTES: z.string().optional(),

  // Optional: Upstash Redis for Rate Limiting (highly recommended for production)
  UPSTASH_REDIS_REST_URL: z.preprocess((v) => v === '' ? undefined : v, z.string().url().optional()),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

// Validate environment variables
let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.errors.map(err => {
      const path = err.path.join('.');
      return `  ❌ ${path}: ${err.message}`;
    }).join('\n');

    console.error('\n🚨 Environment Variable Validation Failed!\n');
    console.error('Missing or invalid environment variables:\n');
    console.error(missingVars);
    console.error('\n💡 Check your .env.local file and ensure all required variables are set.\n');

    throw new Error('Environment validation failed. See console for details.');
  }
  throw error;
}

export { env };

/**
 * Usage Example:
 *
 * // In your API route
 * import { env } from '@/lib/env';
 *
 * export async function POST(request: Request) {
 *   // env is now validated and typed
 *   const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
 *   // ...
 * }
 */
