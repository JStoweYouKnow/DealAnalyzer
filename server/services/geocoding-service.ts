import { geocodingCache } from './geocoding-cache';

interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
}

export class GeocodingService {
  private fallbackCoordinates: { [key: string]: GeocodeResult } = {
        'borrego springs': { lat: 33.2559, lng: -116.3750, formatted_address: 'Borrego Springs, CA, USA' },
        'lake isabella': { lat: 35.6383, lng: -118.4845, formatted_address: 'Lake Isabella, CA, USA' },
        'austin': { lat: 30.2672, lng: -97.7431, formatted_address: 'Austin, TX, USA' },
        'dallas': { lat: 32.7767, lng: -96.7970, formatted_address: 'Dallas, TX, USA' },
        'houston': { lat: 29.7604, lng: -95.3698, formatted_address: 'Houston, TX, USA' },
        'san antonio': { lat: 29.4241, lng: -98.4936, formatted_address: 'San Antonio, TX, USA' },
        'fort worth': { lat: 32.7555, lng: -97.3308, formatted_address: 'Fort Worth, TX, USA' },
        'los angeles': { lat: 34.0522, lng: -118.2437, formatted_address: 'Los Angeles, CA, USA' },
        'san francisco': { lat: 37.7749, lng: -122.4194, formatted_address: 'San Francisco, CA, USA' },
        'san diego': { lat: 32.7157, lng: -117.1611, formatted_address: 'San Diego, CA, USA' },
        'new york': { lat: 40.7128, lng: -74.0060, formatted_address: 'New York, NY, USA' },
        'brooklyn': { lat: 40.6782, lng: -73.9442, formatted_address: 'Brooklyn, NY, USA' },
        'manhattan': { lat: 40.7831, lng: -73.9712, formatted_address: 'Manhattan, NY, USA' },
        'chicago': { lat: 41.8781, lng: -87.6298, formatted_address: 'Chicago, IL, USA' },
        'miami': { lat: 25.7617, lng: -80.1918, formatted_address: 'Miami, FL, USA' },
        'orlando': { lat: 28.5383, lng: -81.3792, formatted_address: 'Orlando, FL, USA' },
        'tampa': { lat: 27.9506, lng: -82.4572, formatted_address: 'Tampa, FL, USA' },
        'seattle': { lat: 47.6062, lng: -122.3321, formatted_address: 'Seattle, WA, USA' },
        'portland': { lat: 45.5152, lng: -122.6784, formatted_address: 'Portland, OR, USA' },
        'denver': { lat: 39.7392, lng: -104.9903, formatted_address: 'Denver, CO, USA' },
        'phoenix': { lat: 33.4484, lng: -112.0740, formatted_address: 'Phoenix, AZ, USA' },
        'las vegas': { lat: 36.1699, lng: -115.1398, formatted_address: 'Las Vegas, NV, USA' },
        'atlanta': { lat: 33.7490, lng: -84.3880, formatted_address: 'Atlanta, GA, USA' },
        'nashville': { lat: 36.1627, lng: -86.7816, formatted_address: 'Nashville, TN, USA' },
        'charlotte': { lat: 35.2271, lng: -80.8431, formatted_address: 'Charlotte, NC, USA' },
        'raleigh': { lat: 35.7796, lng: -78.6382, formatted_address: 'Raleigh, NC, USA' },
        'boston': { lat: 42.3601, lng: -71.0589, formatted_address: 'Boston, MA, USA' },
        'philadelphia': { lat: 39.9526, lng: -75.1652, formatted_address: 'Philadelphia, PA, USA' },
        'washington': { lat: 38.9072, lng: -77.0369, formatted_address: 'Washington, DC, USA' },
        'baltimore': { lat: 39.2904, lng: -76.6122, formatted_address: 'Baltimore, MD, USA' },
        'detroit': { lat: 42.3314, lng: -83.0458, formatted_address: 'Detroit, MI, USA' },
        'cleveland': { lat: 41.4993, lng: -81.6944, formatted_address: 'Cleveland, OH, USA' },
        'columbus': { lat: 39.9612, lng: -82.9988, formatted_address: 'Columbus, OH, USA' },
        'cincinnati': { lat: 39.1031, lng: -84.5120, formatted_address: 'Cincinnati, OH, USA' },
        'indianapolis': { lat: 39.7684, lng: -86.1581, formatted_address: 'Indianapolis, IN, USA' },
        'milwaukee': { lat: 43.0389, lng: -87.9065, formatted_address: 'Milwaukee, WI, USA' },
        'minneapolis': { lat: 44.9778, lng: -93.2650, formatted_address: 'Minneapolis, MN, USA' },
        'kansas city': { lat: 39.0997, lng: -94.5786, formatted_address: 'Kansas City, MO, USA' },
        'st louis': { lat: 38.6270, lng: -90.1994, formatted_address: 'St. Louis, MO, USA' },
        'new orleans': { lat: 29.9511, lng: -90.0715, formatted_address: 'New Orleans, LA, USA' },
        'memphis': { lat: 35.1495, lng: -90.0490, formatted_address: 'Memphis, TN, USA' },
        'louisville': { lat: 38.2527, lng: -85.7585, formatted_address: 'Louisville, KY, USA' },
        'salt lake city': { lat: 40.7608, lng: -111.8910, formatted_address: 'Salt Lake City, UT, USA' },
        'albuquerque': { lat: 35.0844, lng: -106.6504, formatted_address: 'Albuquerque, NM, USA' },
        'tucson': { lat: 32.2226, lng: -110.9747, formatted_address: 'Tucson, AZ, USA' },
        'oklahoma city': { lat: 35.4676, lng: -97.5164, formatted_address: 'Oklahoma City, OK, USA' },
        'tulsa': { lat: 36.1540, lng: -95.9928, formatted_address: 'Tulsa, OK, USA' },
        'little rock': { lat: 34.7465, lng: -92.2896, formatted_address: 'Little Rock, AR, USA' },
        'birmingham': { lat: 33.5207, lng: -86.8025, formatted_address: 'Birmingham, AL, USA' },
        'jacksonville': { lat: 30.3322, lng: -81.6557, formatted_address: 'Jacksonville, FL, USA' },
        'richmond': { lat: 37.5407, lng: -77.4360, formatted_address: 'Richmond, VA, USA' },
        'norfolk': { lat: 36.8508, lng: -76.2859, formatted_address: 'Norfolk, VA, USA' }
      };

  async geocodeAddress(address: string): Promise<GeocodeResult | null> {
    try {
      // Clean and normalize the address
      const cleanAddress = address.trim();

      console.log(`[Geocoding] Starting geocode for address: "${address}"`);

      if (!cleanAddress) {
        console.warn('[Geocoding] Empty address provided');
        return null;
      }

      // 1. Check cache first (Redis/KV or in-memory fallback)
      const cachedResult = await geocodingCache.get(cleanAddress);
      if (cachedResult) {
        console.log(`[Geocoding] ✅ Cache hit: "${address}" -> (${cachedResult.lat}, ${cachedResult.lng})`);
        return cachedResult;
      }

      // 2. Try real geocoding with Nominatim (OpenStreetMap)
      const realResult = await this.geocodeWithNominatim(cleanAddress);
      if (realResult) {
        console.log(`[Geocoding] ✅ Nominatim success: "${address}" -> (${realResult.lat}, ${realResult.lng})`);
        // Cache the result for future requests
        await geocodingCache.set(cleanAddress, realResult);
        return realResult;
      }

      // 3. Fallback to deterministic coordinates for demo purposes
      console.warn(`[Geocoding] ⚠️ Real geocoding failed for "${address}", using fallback coordinates`);
      const fallback = this.getFallbackCoordinates(cleanAddress);
      if (fallback) {
        console.log(`[Geocoding] Fallback result: "${address}" -> (${fallback.lat}, ${fallback.lng})`);
        // Also cache fallback results to avoid repeated API calls
        await geocodingCache.set(cleanAddress, fallback);
      }
      return fallback;

    } catch (error) {
      console.error('[Geocoding] Error:', error);
      // Try fallback on any error
      return this.getFallbackCoordinates(address);
    }
  }

  private async geocodeWithNominatim(address: string): Promise<GeocodeResult | null> {
    try {
      // Use Nominatim geocoding service (OpenStreetMap)
      // Increase limit to get multiple results and filter for best match
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=5&addressdetails=1&countrycodes=us`;

      console.log(`[Nominatim] Requesting: ${url}`);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'RealEstateAnalyzer/1.0 (https://replit.com)', // Required by Nominatim
        },
      });

      if (!response.ok) {
        console.error(`[Nominatim] API error: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();

      console.log(`[Nominatim] Response data:`, JSON.stringify(data, null, 2));

      if (!data || data.length === 0) {
        console.warn(`[Nominatim] No results found for: "${address}"`);
        return null;
      }

      // If multiple results, prefer results that match the address components better
      // For now, use the first result but log all options
      const result = data[0];
      
      if (data.length > 1) {
        console.log(`[Nominatim] Multiple results found (${data.length}), using first: ${result.display_name}`);
        console.log(`[Nominatim] All results:`, data.map((r: any) => r.display_name));
      }

      console.log(`[Nominatim] Found result: ${result.display_name} at (${result.lat}, ${result.lon})`);

      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formatted_address: result.display_name || address
      };

    } catch (error) {
      console.error('[Nominatim] Geocoding failed:', error);
      return null;
    }
  }

  private getFallbackCoordinates(address: string): GeocodeResult | null {
    try {
      const cleanAddress = address.toLowerCase().trim();

      console.log(`[Fallback] Generating coordinates for: "${address}"`);

      // Check for exact city matches first
      for (const [city, coords] of Object.entries(this.fallbackCoordinates)) {
        if (cleanAddress.includes(city)) {
          // Use hash-based variation instead of random to ensure consistency
          // Same address will always get same coordinates
          const hash = this.hashString(cleanAddress);
          const latVariation = ((hash % 1000) / 1000 - 0.5) * 0.1; // ~5.5 mile variation
          const lngVariation = ((Math.floor(hash / 1000) % 1000) / 1000 - 0.5) * 0.1;

          const result = {
            lat: coords.lat + latVariation,
            lng: coords.lng + lngVariation,
            formatted_address: address // Use original address for display
          };

          console.log(`[Fallback] City match "${city}": base (${coords.lat}, ${coords.lng}) + variation -> (${result.lat}, ${result.lng})`);

          return result;
        }
      }

      // Check for state-based coordinates
      const stateCoords = this.getStateBasedCoordinates(cleanAddress);
      if (stateCoords) {
        const hash = this.hashString(cleanAddress);
        // Add variation within the state
        const latVariation = ((hash % 1000) / 1000 - 0.5) * 2; // ~110 mile variation
        const lngVariation = ((Math.floor(hash / 1000) % 1000) / 1000 - 0.5) * 2;

        const result = {
          lat: stateCoords.lat + latVariation,
          lng: stateCoords.lng + lngVariation,
          formatted_address: address
        };

        console.log(`[Fallback] State-based coordinates for "${address}": (${result.lat}, ${result.lng})`);
        return result;
      }

      // If no city or state match, use a hash-based approach for consistent coordinates
      // This ensures the same address always gets the same coordinates
      const hash = this.hashString(cleanAddress);

      // Generate coordinates within the continental US bounds
      const lat = 25 + (hash % 20000) / 1000; // 25-45 latitude (approximate US range)
      const lng = -125 + (Math.floor(hash / 20000) % 50000) / 1000; // -125 to -75 longitude

      const result = {
        lat: Math.round(lat * 10000) / 10000, // Round to 4 decimal places
        lng: Math.round(lng * 10000) / 10000,
        formatted_address: address
      };

      console.log(`[Fallback] Hash-based coordinates for "${address}": (${result.lat}, ${result.lng})`);

      return result;

    } catch (error) {
      console.error('[Fallback] Error:', error);
      return null;
    }
  }

  // Get approximate center coordinates for US states
  private getStateBasedCoordinates(address: string): { lat: number; lng: number } | null {
    const stateMap: { [key: string]: { lat: number; lng: number } } = {
      // State abbreviations
      ' ca ': { lat: 36.7783, lng: -119.4179 }, // California
      ' california': { lat: 36.7783, lng: -119.4179 },
      ' tx ': { lat: 31.9686, lng: -99.9018 }, // Texas
      ' texas': { lat: 31.9686, lng: -99.9018 },
      ' ny ': { lat: 40.7128, lng: -74.0060 }, // New York
      ' new york': { lat: 40.7128, lng: -74.0060 },
      ' fl ': { lat: 27.6648, lng: -81.5158 }, // Florida
      ' florida': { lat: 27.6648, lng: -81.5158 },
      ' wa ': { lat: 47.7511, lng: -120.7401 }, // Washington
      ' washington': { lat: 47.7511, lng: -120.7401 },
      ' az ': { lat: 34.0489, lng: -111.0937 }, // Arizona
      ' arizona': { lat: 34.0489, lng: -111.0937 },
      ' or ': { lat: 43.8041, lng: -120.5542 }, // Oregon
      ' oregon': { lat: 43.8041, lng: -120.5542 },
      ' co ': { lat: 39.5501, lng: -105.7821 }, // Colorado
      ' colorado': { lat: 39.5501, lng: -105.7821 },
      ' nv ': { lat: 38.8026, lng: -116.4194 }, // Nevada
      ' nevada': { lat: 38.8026, lng: -116.4194 },
    };

    // Add spaces around address to match state abbreviations correctly
    const paddedAddress = ` ${address} `;

    for (const [state, coords] of Object.entries(stateMap)) {
      if (paddedAddress.includes(state)) {
        console.log(`[Fallback] State detected: "${state.trim()}" in address`);
        return coords;
      }
    }

    return null;
  }

  // Simple hash function for consistent coordinate generation
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  // Batch geocode multiple addresses with rate limiting for Nominatim
  async geocodeAddresses(addresses: string[]): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = [];
    
    // Process addresses sequentially to respect Nominatim rate limits (1 request per second)
    for (const address of addresses) {
      const result = await this.geocodeAddress(address);
      results.push(result);
      
      // Add delay to respect rate limits (only for batch operations)
      if (addresses.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  // Reverse geocoding (coordinates to address) - placeholder for future implementation
  async reverseGeocode(lat: number, lng: number): Promise<string | null> {
    // In production, this would make an API call to a reverse geocoding service
    // For now, return a generic address format
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
}

export const geocodingService = new GeocodingService();