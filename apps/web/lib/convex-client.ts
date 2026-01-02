import { ConvexHttpClient } from "convex/browser";

let convexClient: ConvexHttpClient | null = null;
let apiModule: any = null;
let initializationAttempted = false;

export async function getConvexClient(): Promise<ConvexHttpClient | null> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) return null;
  
  if (!convexClient) {
    convexClient = new ConvexHttpClient(convexUrl);
  }
  return convexClient;
}

/**
 * Dynamically imports a module using a technique that prevents static analysis by bundlers.
 * This is necessary because Turbopack/Webpack try to resolve dynamic imports at build time,
 * even when they're inside try-catch blocks.
 */
export async function dynamicImportConvexApi(basePath: string): Promise<any | null> {
  try {
    // Use Function constructor to prevent static analysis by bundlers
    // The path is constructed at runtime, so bundlers can't resolve it
    const importFn = new Function('p', 'return import(p)');
    const module = await importFn(basePath + '/convex/_generated/api');
    return module;
  } catch (error) {
    console.warn('[Convex] Could not load Convex API:', error);
    return null;
  }
}

export async function getConvexApi(): Promise<any | null> {
  if (initializationAttempted) return apiModule;
  initializationAttempted = true;
  
  // Try different relative paths based on where this might be called from
  apiModule = await dynamicImportConvexApi('../../..');
  return apiModule;
}

export async function initializeConvex(): Promise<{ client: ConvexHttpClient | null; api: any | null }> {
  const client = await getConvexClient();
  const api = await getConvexApi();
  return { client, api };
}

/**
 * Helper to get Convex client and API for use in API routes.
 * Returns null values if Convex is not configured or API is not available.
 */
export async function getConvexForApiRoute(basePath: string): Promise<{
  client: ConvexHttpClient | null;
  api: any | null;
}> {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return { client: null, api: null };
  }
  
  const client = new ConvexHttpClient(convexUrl);
  const api = await dynamicImportConvexApi(basePath);
  
  return { client, api };
}
