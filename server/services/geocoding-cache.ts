// Redis/KV Cache for Geocoding Results
// Dramatically reduces API calls and improves response time

import { kv } from '@vercel/kv';

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
}

export class GeocodingCache {
  private static readonly CACHE_PREFIX = 'geocode:';
  private static readonly CACHE_TTL = 60 * 60 * 24 * 30; // 30 days

  /**
   * Get cached geocoding result
   */
  static async get(address: string): Promise<GeocodeResult | null> {
    try {
      const cacheKey = this.getCacheKey(address);
      const cached = await kv.get<GeocodeResult>(cacheKey);

      if (cached) {
        console.log(`[Geocoding Cache] ✅ HIT for "${address}"`);
        return cached;
      }

      console.log(`[Geocoding Cache] ❌ MISS for "${address}"`);
      return null;
    } catch (error) {
      console.warn('[Geocoding Cache] Error reading from cache:', error);
      return null; // Fail gracefully
    }
  }

  /**
   * Set geocoding result in cache
   */
  static async set(address: string, result: GeocodeResult): Promise<void> {
    try {
      const cacheKey = this.getCacheKey(address);
      await kv.set(cacheKey, result, {
        ex: this.CACHE_TTL,
      });
      console.log(`[Geocoding Cache] 💾 STORED "${address}"`);
    } catch (error) {
      console.warn('[Geocoding Cache] Error writing to cache:', error);
      // Fail gracefully - caching is optional
    }
  }

  /**
   * Generate cache key from address
   */
  private static getCacheKey(address: string): string {
    const normalized = address.toLowerCase().trim().replace(/\s+/g, ' ');
    return `${this.CACHE_PREFIX}${normalized}`;
  }

  /**
   * Clear all geocoding cache (admin only)
   */
  static async clearAll(): Promise<number> {
    try {
      console.log('[Geocoding Cache] Clearing all cache...');
      const keys = await kv.keys(`${this.CACHE_PREFIX}*`);

      if (keys.length === 0) {
        console.log('[Geocoding Cache] No keys to clear');
        return 0;
      }

      await kv.del(...keys);
      console.log(`[Geocoding Cache] ✅ Cleared ${keys.length} keys`);
      return keys.length;
    } catch (error) {
      console.error('[Geocoding Cache] Error clearing cache:', error);
      throw error;
    }
  }

  /**
   * Get cache statistics
   */
  static async getStats(): Promise<{
    totalKeys: number;
    estimatedSize: string;
  }> {
    try {
      const keys = await kv.keys(`${this.CACHE_PREFIX}*`);
      return {
        totalKeys: keys.length,
        estimatedSize: `~${Math.round(keys.length * 0.2)}KB`, // Rough estimate
      };
    } catch (error) {
      console.error('[Geocoding Cache] Error getting stats:', error);
      return { totalKeys: 0, estimatedSize: '0KB' };
    }
  }
}

// Fallback implementation for when KV is not available (development)
export class GeocodingCacheFallback {
  private static cache = new Map<string, { result: GeocodeResult; expires: number }>();

  static async get(address: string): Promise<GeocodeResult | null> {
    const cacheKey = address.toLowerCase().trim();
    const cached = this.cache.get(cacheKey);

    if (cached && cached.expires > Date.now()) {
      console.log(`[Geocoding Cache Fallback] ✅ HIT for "${address}"`);
      return cached.result;
    }

    console.log(`[Geocoding Cache Fallback] ❌ MISS for "${address}"`);
    return null;
  }

  static async set(address: string, result: GeocodeResult): Promise<void> {
    const cacheKey = address.toLowerCase().trim();
    const expires = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.cache.set(cacheKey, { result, expires });
    console.log(`[Geocoding Cache Fallback] 💾 STORED "${address}"`);
  }

  static async clearAll(): Promise<number> {
    const size = this.cache.size;
    this.cache.clear();
    return size;
  }

  static async getStats() {
    return {
      totalKeys: this.cache.size,
      estimatedSize: `~${Math.round(this.cache.size * 0.2)}KB`,
    };
  }
}

// Export the appropriate cache based on environment
export const geocodingCache =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? GeocodingCache
    : GeocodingCacheFallback;
