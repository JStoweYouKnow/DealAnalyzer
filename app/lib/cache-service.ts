import NodeCache from 'node-cache';

// Create cache instances with appropriate TTLs
export const criteriaCache = new NodeCache({
  stdTTL: 7200, // 2 hours - criteria doesn't change often
  checkperiod: 600, // Check for expired keys every 10 minutes
  useClones: false, // Better performance for large objects
});

export const mortgageRateCache = new NodeCache({
  stdTTL: 3600, // 1 hour - rates change but not that frequently
  checkperiod: 300, // Check every 5 minutes
  useClones: false,
});

export const analysisCache = new NodeCache({
  stdTTL: 1800, // 30 minutes - cache analysis results
  checkperiod: 300,
  useClones: false,
  maxKeys: 100, // Limit cache size
});

/**
 * Get cached value or fetch and cache it
 */
export async function getCachedOrFetch<T>(
  cache: NodeCache,
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number | string
): Promise<T> {
  const cached = cache.get<T>(key);
  if (cached !== undefined) {
    return cached;
  }

  const value = await fetcher();
  if (ttl !== undefined) {
    cache.set(key, value, ttl);
  } else {
    cache.set(key, value);
  }
  return value;
}

/**
 * Clear specific cache or all caches
 */
export function clearCache(cache?: NodeCache) {
  if (cache) {
    cache.flushAll();
  } else {
    criteriaCache.flushAll();
    mortgageRateCache.flushAll();
    analysisCache.flushAll();
  }
}

