import { NextRequest, NextResponse } from "next/server";
import { z, ZodError } from "zod";
import { storage } from "../../../server/storage";
import { insertSavedFilterSchema } from "@shared/schema";
import { timingSafeEqual } from "crypto";
import { jwtVerify, decodeJwt, type JWTPayload } from "jose";

/**
 * Redacts sensitive fields from an object to prevent PII exposure in logs.
 * Replaces sensitive values with "<REDACTED>" and preserves only safe fields.
 */
function redactSensitiveData(data: unknown): unknown {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const sensitiveKeys = new Set([
    "userId",
    "description",
    "name",
    "email",
    "emailContent",
    "address",
    "phone",
    "ssn",
    "token",
    "password",
    "apiKey",
    "secret",
  ]);

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (sensitiveKeys.has(key)) {
      redacted[key] = "<REDACTED>";
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Logs an error with redacted data to prevent PII exposure.
 * Uses structured logging format for consistency.
 */
function logError(message: string, context?: Record<string, unknown>) {
  const redactedContext = context ? redactSensitiveData(context) : undefined;
  console.error(`[ERROR] ${message}`, redactedContext || "");
}

/**
 * Checks if a token string appears to be a JWT (has the format xxxx.yyyy.zzzz)
 */
function isJWT(token: string): boolean {
  const parts = token.split(".");
  return parts.length === 3 && parts.every(part => part.length > 0);
}

/**
 * Validates and decodes a JWT token, returning the user ID from the 'sub' claim
 * (or another configured claim via JWT_USER_ID_CLAIM env var).
 * Returns null if validation fails.
 */
async function validateAndDecodeJWT(token: string): Promise<string | null> {
  try {
    // Get JWT secret from environment (required for validation)
    const jwtSecret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    if (!jwtSecret) {
      logError("JWT validation failed: JWT_SECRET or AUTH_SECRET not configured");
      return null;
    }

    // Get the claim name to use for user ID (defaults to 'sub')
    const userIdClaim = process.env.JWT_USER_ID_CLAIM || "sub";

    // Verify the JWT signature and decode the payload
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret, {
      // Allow some clock skew for token expiration checks
      clockTolerance: "2m",
    });

    // Extract user ID from the configured claim
    const userId = payload[userIdClaim];
    if (!userId || typeof userId !== "string") {
      logError("JWT validation failed: user ID claim not found or invalid", {
        claim: userIdClaim,
        payload: redactSensitiveData(payload),
      });
      return null;
    }

    return userId;
  } catch (error) {
    // JWT verification failed (expired, invalid signature, malformed, etc.)
    logError("JWT validation error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Looks up an opaque API key in secure storage and returns the associated user ID.
 * Currently supports environment variable mapping (API_KEY_TO_USER_ID).
 * Can be extended to use database lookups in the future.
 * Returns null if key is not found or invalid.
 */
async function lookupAPIKey(apiKey: string): Promise<string | null> {
  try {
    // Method 1: Environment variable mapping (format: "key1:userId1,key2:userId2")
    const envMapping = process.env.API_KEY_TO_USER_ID;
    if (envMapping) {
      const mappings = envMapping.split(",").map(m => m.trim());
      for (const mapping of mappings) {
        const [key, userId] = mapping.split(":").map(s => s.trim());
        if (key && userId) {
          // Use timing-safe comparison to prevent timing attacks
          const keyBuffer = Buffer.from(key);
          const apiKeyBuffer = Buffer.from(apiKey);
          if (keyBuffer.length === apiKeyBuffer.length) {
            if (timingSafeEqual(keyBuffer, apiKeyBuffer)) {
              return userId;
            }
          }
        }
      }
    }

    // Method 2: Single API_SECRET for backward compatibility (if no mapping provided)
    // Only use this if no API_KEY_TO_USER_ID mapping is configured
    if (!envMapping && process.env.API_SECRET) {
      const secretBuffer = Buffer.from(process.env.API_SECRET);
      const apiKeyBuffer = Buffer.from(apiKey);
      if (secretBuffer.length === apiKeyBuffer.length) {
        if (timingSafeEqual(secretBuffer, apiKeyBuffer)) {
          // If using legacy API_SECRET, we still need to reject it since
          // it doesn't provide a unique user identifier
          logError("API key authentication rejected: API_SECRET does not provide unique user identifier");
          return null;
        }
      }
    }

    // Method 3: Future extension - database lookup
    // TODO: Implement database lookup for API keys if needed
    // const apiKeyRecord = await storage.getAPIKey(apiKey);
    // if (apiKeyRecord && apiKeyRecord.isActive) {
    //   return apiKeyRecord.userId;
    // }

    // Key not found
    return null;
  } catch (error) {
    logError("API key lookup error", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Authenticates the request and returns the user ID if authenticated.
 * Tries Clerk auth first, then falls back to bearer token authentication.
 * For bearer tokens:
 * - If the token is a JWT: validates and decodes it, extracting the user ID from the 'sub' claim
 * - If the token is an opaque API key: looks it up in secure storage (env vars or database)
 * Returns null if not authenticated.
 */
async function authenticateRequest(request: NextRequest): Promise<string | null> {
  // Try Clerk authentication first
  try {
    const { auth } = await import("@clerk/nextjs/server");
    const authResult = await auth();
    if (authResult?.userId) {
      return authResult.userId;
    }
  } catch (error) {
    // Clerk not available or not configured, continue to bearer token check
  }

  // Fall back to bearer token authentication
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    
    if (!token) {
      return null;
    }

    // Determine if token is a JWT or opaque API key
    if (isJWT(token)) {
      // JWT token: validate and decode to extract user ID
      const userId = await validateAndDecodeJWT(token);
      if (userId) {
        return userId;
      }
      // JWT validation failed - reject the request
      return null;
    } else {
      // Opaque API key: look up in secure storage
      const userId = await lookupAPIKey(token);
      if (userId) {
        return userId;
      }
      // API key not found or invalid - reject the request
      return null;
    }
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const filters = await storage.getSavedFilters();
    return NextResponse.json({ success: true, data: filters });
  } catch (error) {
    console.error("Error fetching saved filters:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch saved filters" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Authenticate the request first, before parsing body
  const userId = await authenticateRequest(request);
  if (!userId) {
    console.warn("Unauthorized request to POST /api/filters - no authenticated user");
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Parse and validate request body
  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    console.error("Error parsing request body in POST /api/filters:", error);
    return NextResponse.json(
      { success: false, error: "Invalid JSON in request body" },
      { status: 400 }
    );
  }

  // Validate body against schema
  let validated: z.infer<typeof insertSavedFilterSchema>;
  try {
    validated = insertSavedFilterSchema.parse(body);
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof ZodError || (error as any)?.name === "ZodError") {
      const zodError = error instanceof ZodError 
        ? error 
        : error as ZodError;
      logError("Validation error in POST /api/filters", {
        errors: zodError.errors,
        receivedBody: body,
      });
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: zodError.errors.map((err) => ({
            path: err.path.join("."),
            message: err.message,
            code: err.code,
          })),
        },
        { status: 400 }
      );
    }
    // Re-throw if it's not a ZodError
    throw error;
  }

  // Attach userId to validated data before creating the filter
  validated.userId = userId;

  // Create saved filter (storage operation)
  try {
    const filter = await storage.createSavedFilter(validated);
    return NextResponse.json({ success: true, data: filter });
  } catch (error) {
    // Handle storage/database errors
    logError("Database error creating saved filter in POST /api/filters", {
      error: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      validatedData: validated,
    });
    return NextResponse.json(
      { success: false, error: "Failed to create saved filter" },
      { status: 500 }
    );
  }
}

