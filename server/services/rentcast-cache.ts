// RentCast API Request Deduplication & Caching
// Saves $$$ by preventing duplicate API calls

import { kv } from '@vercel/kv';
import crypto from 'crypto';

export class RentCastCache {
  private static readonly CACHE_PREFIX = 'rentcast:';
  private static readonly CACHE_TTL = 60 * 60 * 24; // 24 hours for market data
  private static inFlightRequests = new Map<string, Promise<any>>();

  /**
   * Get cached result or execute function with deduplication
   */
  static async getOrFetch<T>(
    key: string,
    ttl: number = this.CACHE_TTL,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(key);

    // 1. Check cache first
    const cached = await this.get<T>(cacheKey);
    if (cached !== null) {
      console.log(`[RentCast Cache] ✅ HIT: ${key}`);
      return cached;
    }

    // 2. Check if request is already in-flight
    const inFlight = this.inFlightRequests.get(cacheKey);
    if (inFlight) {
      console.log(`[RentCast Cache] ⏳ WAITING for in-flight: ${key}`);
      return await inFlight;
    }

    // 3. Make the request and track it
    console.log(`[RentCast Cache] ❌ MISS: ${key} - fetching...`);
    const promise = fetchFn()
      .then(async (result) => {
        // Cache the result
        await this.set(cacheKey, result, ttl);
        // Remove from in-flight
        this.inFlightRequests.delete(cacheKey);
        return result;
      })
      .catch((error) => {
        // Remove from in-flight on error
        this.inFlightRequests.delete(cacheKey);
        throw error;
      });

    // Track the in-flight request
    this.inFlightRequests.set(cacheKey, promise);

    return await promise;
  }

  /**
   * Get from cache
   */
  private static async get<T>(cacheKey: string): Promise<T | null> {
    try {
      const value = await kv.get<T>(cacheKey);
      return value;
    } catch (error) {
      console.warn('[RentCast Cache] Error reading cache:', error);
      return null;
    }
  }

  /**
   * Set in cache
   */
  private static async set(cacheKey: string, value: any, ttl: number): Promise<void> {
    try {
      await kv.set(cacheKey, value, { ex: ttl });
      console.log(`[RentCast Cache] 💾 STORED: ${cacheKey}`);
    } catch (error) {
      console.warn('[RentCast Cache] Error writing cache:', error);
    }
  }

  /**
   * Generate cache key from request params
   */
  private static getCacheKey(key: string): string {
    // Use MD5 hash for consistent, short keys
    const hash = crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
    return `${this.CACHE_PREFIX}${hash}`;
  }

  /**
   * Create a cache key from endpoint and params
   */
  static createKey(endpoint: string, params: Record<string, any>): string {
    // Sort params for consistent keys
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);

    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Clear all RentCast cache
   */
  static async clearAll(): Promise<number> {
    try {
      const keys = await kv.keys(`${this.CACHE_PREFIX}*`);
      if (keys.length === 0) return 0;

      await kv.del(...keys);
      console.log(`[RentCast Cache] ✅ Cleared ${keys.length} keys`);
      return keys.length;
    } catch (error) {
      console.error('[RentCast Cache] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats() {
    try {
      const keys = await kv.keys(`${this.CACHE_PREFIX}*`);
      return {
        totalKeys: keys.length,
        inFlight: this.inFlightRequests.size,
        estimatedSize: `~${Math.round(keys.length * 2)}KB`,
      };
    } catch (error) {
      console.error('[RentCast Cache] Error getting stats:', error);
      return { totalKeys: 0, inFlight: 0, estimatedSize: '0KB' };
    }
  }
}

// Fallback implementation for when KV is not available
export class RentCastCacheFallback {
  private static cache = new Map<string, { value: any; expires: number }>();
  private static inFlightRequests = new Map<string, Promise<any>>();

  static async getOrFetch<T>(
    key: string,
    ttl: number,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const cacheKey = this.getCacheKey(key);

    // Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      console.log(`[RentCast Cache Fallback] ✅ HIT: ${key}`);
      return cached.value;
    }

    // Check in-flight
    const inFlight = this.inFlightRequests.get(cacheKey);
    if (inFlight) {
      console.log(`[RentCast Cache Fallback] ⏳ WAITING: ${key}`);
      return await inFlight;
    }

    // Fetch
    console.log(`[RentCast Cache Fallback] ❌ MISS: ${key}`);
    const promise = fetchFn()
      .then((result) => {
        this.cache.set(cacheKey, {
          value: result,
          expires: Date.now() + ttl * 1000,
        });
        this.inFlightRequests.delete(cacheKey);
        return result;
      })
      .catch((error) => {
        this.inFlightRequests.delete(cacheKey);
        throw error;
      });

    this.inFlightRequests.set(cacheKey, promise);
    return await promise;
  }

  private static getCacheKey(key: string): string {
    const hash = crypto.createHash('md5').update(key).digest('hex').substring(0, 16);
    return hash;
  }

  static createKey(endpoint: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {} as Record<string, any>);
    return `${endpoint}:${JSON.stringify(sortedParams)}`;
  }

  static async clearAll(): Promise<number> {
    const size = this.cache.size;
    this.cache.clear();
    this.inFlightRequests.clear();
    return size;
  }

  static async getStats() {
    return {
      totalKeys: this.cache.size,
      inFlight: this.inFlightRequests.size,
      estimatedSize: `~${Math.round(this.cache.size * 2)}KB`,
    };
  }
}

// Export the appropriate cache
export const rentCastCache =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? RentCastCache
    : RentCastCacheFallback;
