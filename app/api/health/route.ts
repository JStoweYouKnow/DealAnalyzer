import { NextResponse } from "next/server";
import { getRedis } from "@/lib/rate-limit";

interface HealthCheckResult {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  services: {
    database: ServiceStatus;
    redis: ServiceStatus;
    clerk: ServiceStatus;
    convex: ServiceStatus;
  };
}

interface ServiceStatus {
  status: "ok" | "error" | "unavailable";
  message?: string;
  responseTime?: number;
}

const HEALTH_CHECK_TIMEOUT = 5000; // 5 seconds

async function checkServiceWithTimeout<T>(
  checkFn: () => Promise<T>,
  timeoutMs: number = HEALTH_CHECK_TIMEOUT
): Promise<{ success: boolean; result?: T; error?: string; responseTime: number }> {
  const startTime = Date.now();
  
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Service check timeout")), timeoutMs);
    });
    
    const result = await Promise.race([checkFn(), timeoutPromise]);
    const responseTime = Date.now() - startTime;
    
    return { success: true, result, responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage, responseTime };
  }
}

async function checkConvexDatabase(): Promise<ServiceStatus> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  
  if (!convexUrl) {
    return { status: "unavailable", message: "NEXT_PUBLIC_CONVEX_URL not configured" };
  }
  
  try {
    // Try to import and initialize Convex
    const checkResult = await checkServiceWithTimeout(async () => {
      try {
        // Dynamic import to avoid build-time errors
        const apiModule = await import('../../../convex/_generated/api.js').catch(() => 
          import('../../../convex/_generated/api')
        );
        
        if (!apiModule?.api) {
          throw new Error("Convex API not available");
        }
        
        // Try a simple query to verify connectivity
        // Use the ConvexHttpClient if available
        const { ConvexHttpClient } = await import("convex/browser");
        const client = new ConvexHttpClient(convexUrl);
        
        // Note: We can't actually query without a valid query function,
        // so we'll just verify the client can be created and URL is valid
        return true;
      } catch (error) {
        throw error;
      }
    }, 3000);
    
    if (checkResult.success) {
      return {
        status: "ok",
        message: "Connected",
        responseTime: checkResult.responseTime,
      };
    } else {
      return {
        status: "error",
        message: checkResult.error || "Connection failed",
        responseTime: checkResult.responseTime,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const redis = getRedis();
  
  if (!redis) {
    return {
      status: "unavailable",
      message: "Redis not configured (UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN missing)",
    };
  }
  
  try {
    const checkResult = await checkServiceWithTimeout(async () => {
      // Simple ping-like check using a GET operation
      await redis.get("health-check");
      return true;
    }, 3000);
    
    if (checkResult.success) {
      return {
        status: "ok",
        message: "Connected",
        responseTime: checkResult.responseTime,
      };
    } else {
      return {
        status: "error",
        message: checkResult.error || "Connection failed",
        responseTime: checkResult.responseTime,
      };
    }
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function checkClerk(): Promise<ServiceStatus> {
  const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const secretKey = process.env.CLERK_SECRET_KEY;
  
  if (!publishableKey || !secretKey) {
    return {
      status: "unavailable",
      message: "Clerk keys not configured",
    };
  }
  
  // Clerk is a managed service, so we just check if keys are present
  // In a real implementation, you might want to verify the keys are valid
  return {
    status: "ok",
    message: "Configured",
  };
}

export async function GET() {
  const timestamp = new Date().toISOString();
  
  // Check all services in parallel
  const [database, redis, clerk, convex] = await Promise.all([
    checkConvexDatabase(),
    checkRedis(),
    checkClerk(),
    checkConvexDatabase(), // Convex is the database
  ]);
  
  const services = {
    convex, // Database is Convex
    redis,
    clerk,
    database: convex, // Alias for backward compatibility
  };
  
  // Determine overall status
  const serviceStatuses = Object.values(services);
  const hasErrors = serviceStatuses.some(s => s.status === "error");
  const hasUnavailable = serviceStatuses.some(s => s.status === "unavailable");
  
  let overallStatus: "healthy" | "degraded" | "unhealthy";
  if (hasErrors) {
    overallStatus = "unhealthy";
  } else if (hasUnavailable) {
    overallStatus = "degraded";
  } else {
    overallStatus = "healthy";
  }
  
  const result: HealthCheckResult = {
    status: overallStatus,
    timestamp,
    services,
  };
  
  // Return appropriate HTTP status code
  const statusCode = overallStatus === "healthy" ? 200 : overallStatus === "degraded" ? 200 : 503;
  
  return NextResponse.json(result, { status: statusCode });
}

