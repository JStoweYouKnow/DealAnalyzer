/**
 * Free Alternative Market Data APIs
 *
 * This module integrates multiple free public APIs to provide comprehensive
 * market intelligence data for real estate investment analysis.
 */

import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';

// ============================================================================
// CONFIGURATION
// ============================================================================

const API_KEYS = {
  walkScore: Constants.expoConfig?.extra?.walkScoreApiKey || '',
  openWeatherMap: Constants.expoConfig?.extra?.openWeatherMapApiKey || '',
  fred: Constants.expoConfig?.extra?.fredApiKey || '',
};

// Request timeout in milliseconds (10 seconds)
const REQUEST_TIMEOUT = 10000;

// ============================================================================
// 1. WALK SCORE API - Walkability, Transit & Bike Scores
// ============================================================================

/**
 * Walk Score API
 *
 * Provides walkability, transit, and bike scores for any address.
 * Free tier: 5,000 calls/day
 * Sign up: https://www.walkscore.com/professional/api.php
 *
 * Scores:
 * - 90-100: Walker's Paradise (daily errands do not require a car)
 * - 70-89: Very Walkable (most errands can be accomplished on foot)
 * - 50-69: Somewhat Walkable (some errands can be accomplished on foot)
 * - 25-49: Car-Dependent (most errands require a car)
 * - 0-24: Very Car-Dependent (almost all errands require a car)
 */
export class WalkScoreAPI {
  private baseURL = 'https://api.walkscore.com';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_KEYS.walkScore;
  }

  /**
   * Get Walk Score, Transit Score, and Bike Score for an address
   */
  async getScores(params: {
    address: string;
    lat: number;
    lon: number;
  }): Promise<{
    walkScore?: number;
    walkDescription?: string;
    transitScore?: number;
    transitDescription?: string;
    bikeScore?: number;
    bikeDescription?: string;
  }> {
    if (!this.apiKey) {
      console.warn('Walk Score API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${this.baseURL}/score`, {
        params: {
          format: 'json',
          address: params.address,
          lat: params.lat,
          lon: params.lon,
          transit: 1,
          bike: 1,
          wsapikey: this.apiKey,
        },
        timeout: REQUEST_TIMEOUT,
      });

      return {
        walkScore: response.data.walkscore,
        walkDescription: response.data.description,
        transitScore: response.data.transit?.score,
        transitDescription: response.data.transit?.description,
        bikeScore: response.data.bike?.score,
        bikeDescription: response.data.bike?.description,
      };
    } catch (error) {
      console.error('Walk Score API error:', error);
      return {};
    }
  }
}

// ============================================================================
// 2. OPENWEATHERMAP API - Climate & Weather Data
// ============================================================================

/**
 * OpenWeatherMap API
 *
 * Provides current weather, forecasts, and climate data.
 * Free tier: 1,000 calls/day, 60 calls/minute
 * Sign up: https://openweathermap.org/api
 */
export class OpenWeatherMapAPI {
  private baseURL = 'https://api.openweathermap.org/data/2.5';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_KEYS.openWeatherMap;
  }

  /**
   * Get current weather data for a location
   */
  async getCurrentWeather(params: {
    lat: number;
    lon: number;
  }): Promise<{
    temp?: number;
    feelsLike?: number;
    humidity?: number;
    description?: string;
    icon?: string;
  }> {
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          lat: params.lat,
          lon: params.lon,
          appid: this.apiKey,
          units: 'imperial', // Fahrenheit
        },
        timeout: REQUEST_TIMEOUT,
      });

      return {
        temp: response.data.main?.temp,
        feelsLike: response.data.main?.feels_like,
        humidity: response.data.main?.humidity,
        description: response.data.weather?.[0]?.description,
        icon: response.data.weather?.[0]?.icon,
      };
    } catch (error) {
      console.error('OpenWeatherMap API error:', error);
      return {};
    }
  }

  /**
   * Get climate statistics (requires historical data API - paid tier)
   * This is a placeholder for future premium feature
   */
  async getClimateStats(params: {
    lat: number;
    lon: number;
  }): Promise<{
    avgAnnualTemp?: number;
    avgAnnualPrecipitation?: number;
  }> {
    // Climate data requires premium subscription
    // Placeholder for future implementation
    return {};
  }
}

// ============================================================================
// 3. BUREAU OF LABOR STATISTICS (BLS) API - Employment & Wage Data
// ============================================================================

/**
 * BLS API
 *
 * Provides employment statistics, unemployment rates, and wage data.
 * Completely FREE - No API key required!
 * Daily limit: 500 queries
 * Docs: https://www.bls.gov/developers/api_signature_v2.htm
 *
 * Common Series IDs:
 * - Unemployment Rate: LAUCN{fips}0000000003
 * - Employment Level: LAUCN{fips}0000000005
 * - Labor Force: LAUCN{fips}0000000006
 */
export class BLSAPI {
  private baseURL = 'https://api.bls.gov/publicAPI/v2';

  /**
   * Get unemployment rate for a county (requires FIPS code)
   */
  async getUnemploymentRate(countyFips: string): Promise<{
    unemploymentRate?: number;
    laborForce?: number;
    employed?: number;
    unemployed?: number;
    year?: number;
    period?: string;
  }> {
    try {
      // Build series IDs for the county
      const seriesIds = [
        `LAUCN${countyFips}0000000003`, // Unemployment rate
        `LAUCN${countyFips}0000000004`, // Unemployed persons
        `LAUCN${countyFips}0000000005`, // Employed persons
        `LAUCN${countyFips}0000000006`, // Labor force
      ];

      const response = await axios.post(
        `${this.baseURL}/timeseries/data/`,
        {
          seriesid: seriesIds,
          startyear: new Date().getFullYear() - 1,
          endyear: new Date().getFullYear(),
          registrationkey: '', // Optional - increases daily limit to 500
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT, // 10 second timeout to prevent hanging requests
        }
      );

      if (response.data.status === 'REQUEST_SUCCEEDED') {
        const series = response.data.Results.series;

        // Get most recent data for each series
        const getMostRecent = (seriesId: string) => {
          const seriesData = series.find((s: any) => s.seriesID === seriesId);
          return seriesData?.data?.[0]?.value ? parseFloat(seriesData.data[0].value) : undefined;
        };

        return {
          unemploymentRate: getMostRecent(seriesIds[0]),
          unemployed: getMostRecent(seriesIds[1]),
          employed: getMostRecent(seriesIds[2]),
          laborForce: getMostRecent(seriesIds[3]),
          year: parseInt(series[0]?.data?.[0]?.year || '', 10),
          period: series[0]?.data?.[0]?.period,
        };
      }

      return {};
    } catch (error) {
      console.error('BLS API error:', error);
      return {};
    }
  }

  /**
   * Get average wage data for an area
   */
  async getAverageWages(areaCode: string): Promise<{
    averageWeeklyWage?: number;
    year?: number;
    quarter?: string;
  }> {
    try {
      // QCEW (Quarterly Census of Employment and Wages) series
      const seriesId = `ENU${areaCode}00500010`; // All industries, private sector

      const response = await axios.post(
        `${this.baseURL}/timeseries/data/`,
        {
          seriesid: [seriesId],
          startyear: new Date().getFullYear() - 1,
          endyear: new Date().getFullYear(),
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: REQUEST_TIMEOUT, // 10 second timeout to prevent hanging requests
        }
      );

      if (response.data.status === 'REQUEST_SUCCEEDED') {
        const latestData = response.data.Results.series[0]?.data?.[0];
        return {
          averageWeeklyWage: latestData?.value ? parseFloat(latestData.value) : undefined,
          year: parseInt(latestData?.year || '', 10),
          quarter: latestData?.period,
        };
      }

      return {};
    } catch (error) {
      console.error('BLS API (wages) error:', error);
      return {};
    }
  }
}

// ============================================================================
// 4. FEDERAL RESERVE ECONOMIC DATA (FRED) API - Economic Indicators
// ============================================================================

/**
 * FRED API
 *
 * Provides economic data from Federal Reserve Bank of St. Louis.
 * Completely FREE with API key
 * No rate limits
 * Sign up: https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Useful series for real estate:
 * - MORTGAGE30US: 30-Year Fixed Rate Mortgage Average
 * - CSUSHPINSA: S&P/Case-Shiller U.S. National Home Price Index
 * - HOUST: Housing Starts
 * - GDP: Gross Domestic Product
 */
export class FREDAPI {
  private baseURL = 'https://api.stlouisfed.org/fred';
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || API_KEYS.fred;
  }

  /**
   * Get current 30-year mortgage rate
   */
  async getMortgageRate(): Promise<{
    rate?: number;
    date?: string;
  }> {
    if (!this.apiKey) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${this.baseURL}/series/observations`, {
        params: {
          series_id: 'MORTGAGE30US',
          api_key: this.apiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
        timeout: REQUEST_TIMEOUT,
      });

      const latestData = response.data.observations?.[0];
      return {
        rate: latestData?.value ? parseFloat(latestData.value) : undefined,
        date: latestData?.date,
      };
    } catch (error) {
      console.error('FRED API (mortgage rate) error:', error);
      return {};
    }
  }

  /**
   * Get national home price index
   */
  async getHomePriceIndex(): Promise<{
    index?: number;
    date?: string;
    change1Year?: number;
  }> {
    if (!this.apiKey) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${this.baseURL}/series/observations`, {
        params: {
          series_id: 'CSUSHPINSA',
          api_key: this.apiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 13, // Get last 13 months to calculate YoY change
        },
        timeout: REQUEST_TIMEOUT,
      });

      const observations = response.data.observations;
      const latest = observations?.[0];
      const yearAgo = observations?.[12];

      let change1Year;
      if (latest?.value && yearAgo?.value) {
        const currentValue = parseFloat(latest.value);
        const pastValue = parseFloat(yearAgo.value);
        change1Year = ((currentValue - pastValue) / pastValue) * 100;
      }

      return {
        index: latest?.value ? parseFloat(latest.value) : undefined,
        date: latest?.date,
        change1Year,
      };
    } catch (error) {
      console.error('FRED API (home price index) error:', error);
      return {};
    }
  }

  /**
   * Get housing starts data
   */
  async getHousingStarts(): Promise<{
    starts?: number;
    date?: string;
  }> {
    if (!this.apiKey) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${this.baseURL}/series/observations`, {
        params: {
          series_id: 'HOUST',
          api_key: this.apiKey,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
        timeout: REQUEST_TIMEOUT,
      });

      const latestData = response.data.observations?.[0];
      return {
        starts: latestData?.value ? parseFloat(latestData.value) : undefined,
        date: latestData?.date,
      };
    } catch (error) {
      console.error('FRED API (housing starts) error:', error);
      return {};
    }
  }
}

// ============================================================================
// 5. GEOCODING SERVICE - Convert Address to Coordinates
// ============================================================================

/**
 * Nominatim Geocoding API (OpenStreetMap)
 *
 * Completely FREE geocoding service
 * No API key required
 * Rate limit: 1 request per second
 * Usage Policy: https://operations.osmfoundation.org/policies/nominatim/
 */

// Rate limiting state for geocoding API
let lastGeocodingRequestTime = 0; // Timestamp in milliseconds
let geocodingRequestQueue: Promise<void> = Promise.resolve(); // Promise queue for serialization

/**
 * Sleep utility function
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Rate-limited request wrapper for geocoding API
 * Ensures requests are serialized and respect the 1 req/sec limit
 */
async function rateLimitedGeocodingRequest<T>(requestFn: () => Promise<T>): Promise<T> {
  // Wait for previous request to complete (serialization)
  await geocodingRequestQueue;

  // Create a new promise for this request
  let resolveQueue: () => void;
  geocodingRequestQueue = new Promise(resolve => {
    resolveQueue = resolve;
  });

  try {
    const now = Date.now();
    const elapsed = now - lastGeocodingRequestTime;

    // Only sleep if less than 1 second has passed since last request
    if (elapsed < 1000) {
      const remainingWait = 1000 - elapsed;
      await sleep(remainingWait);
    }

    // Perform the request
    const result = await requestFn();

    // Update last request time
    lastGeocodingRequestTime = Date.now();

    return result;
  } finally {
    // Release the queue for the next request
    resolveQueue!();
  }
}

export class GeocodingAPI {
  private baseURL = 'https://nominatim.openstreetmap.org';

  /**
   * Convert address to coordinates
   */
  async geocode(address: string): Promise<{
    lat?: number;
    lon?: number;
    displayName?: string;
    county?: string;
    state?: string;
    zipCode?: string;
  }> {
    try {
      return await rateLimitedGeocodingRequest(async () => {
        const response = await axios.get(`${this.baseURL}/search`, {
          params: {
            q: address,
            format: 'json',
            limit: 1,
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'DealAnalyzer Mobile App', // Required by Nominatim
          },
          timeout: REQUEST_TIMEOUT,
        });

        const result = response.data[0];
        if (!result) return {};

        return {
          lat: result.lat ? parseFloat(result.lat) : undefined,
          lon: result.lon ? parseFloat(result.lon) : undefined,
          displayName: result.display_name,
          county: result.address?.county,
          state: result.address?.state,
          zipCode: result.address?.postcode,
        };
      });
    } catch (error) {
      console.error('Geocoding API error:', error);
      return {};
    }
  }

  /**
   * Convert coordinates to address details (reverse geocoding)
   * Returns county, state, and zipCode when available, or null/undefined if not found
   */
  async reverseGeocode(lat: number, lon: number): Promise<{
    displayName?: string;
    county?: string | null;
    state?: string | null;
    zipCode?: string | null;
  }> {
    try {
      return await rateLimitedGeocodingRequest(async () => {
        const response = await axios.get(`${this.baseURL}/reverse`, {
          params: {
            lat,
            lon,
            format: 'json',
            addressdetails: 1,
          },
          headers: {
            'User-Agent': 'DealAnalyzer Mobile App', // Required by Nominatim
          },
          timeout: REQUEST_TIMEOUT,
        });

        const result = response.data;
        if (!result || !result.address) {
          // Explicitly return null values when reverse geocoding fails
          return {
            county: null,
            state: null,
            zipCode: null,
          };
        }

        return {
          displayName: result.display_name,
          county: result.address?.county || null,
          state: result.address?.state || null,
          zipCode: result.address?.postcode || null,
        };
      });
    } catch (error) {
      console.error('Reverse geocoding API error:', error);
      // Explicitly return null values on error to indicate missing data
      return {
        county: null,
        state: null,
        zipCode: null,
      };
    }
  }
}

// ============================================================================
// COMBINED MARKET DATA SERVICE
// ============================================================================

/**
 * Combined Market Data Service
 *
 * Aggregates data from all free APIs to provide comprehensive market intelligence
 */
export class MarketDataService {
  private walkScore: WalkScoreAPI;
  private weather: OpenWeatherMapAPI;
  private bls: BLSAPI;
  private fred: FREDAPI;
  private geocoding: GeocodingAPI;

  constructor() {
    this.walkScore = new WalkScoreAPI();
    this.weather = new OpenWeatherMapAPI();
    this.bls = new BLSAPI();
    this.fred = new FREDAPI();
    this.geocoding = new GeocodingAPI();
  }

  /**
   * Get comprehensive market data for an address
   */
  async getMarketIntelligence(params: {
    address: string;
    lat?: number;
    lon?: number;
    countyFips?: string;
  }): Promise<{
    location?: {
      lat: number;
      lon: number;
      county?: string | null;
      state?: string | null;
      zipCode?: string | null;
    };
    walkability?: {
      walkScore?: number;
      transitScore?: number;
      bikeScore?: number;
    };
    weather?: {
      temp?: number;
      humidity?: number;
      description?: string;
    };
    employment?: {
      unemploymentRate?: number;
      laborForce?: number;
    };
    economy?: {
      mortgageRate?: number;
      homePriceIndex?: number;
      homePriceChange?: number;
    };
  }> {
    try {
      // Step 1: Geocode if coordinates not provided
      let lat = params.lat;
      let lon = params.lon;
      let geoData: {
        county?: string | null;
        state?: string | null;
        zipCode?: string | null;
      } = {};

      if (!lat || !lon) {
        // Geocode address to get coordinates and location details
        const geocodeResult = await this.geocoding.geocode(params.address);
        lat = geocodeResult.lat;
        lon = geocodeResult.lon;
        geoData = {
          county: geocodeResult.county || null,
          state: geocodeResult.state || null,
          zipCode: geocodeResult.zipCode || null,
        };
      } else {
        // Coordinates provided directly - perform reverse geocoding to get location details
        // This ensures county, state, and zipCode are populated when available
        const reverseGeoResult = await this.geocoding.reverseGeocode(lat, lon);
        geoData = {
          county: reverseGeoResult.county ?? null,
          state: reverseGeoResult.state ?? null,
          zipCode: reverseGeoResult.zipCode ?? null,
        };
      }

      if (!lat || !lon) {
        console.warn('Unable to geocode address');
        return {};
      }

      // Step 2: Fetch all data in parallel
      const [walkabilityData, weatherData, mortgageData, homePriceData, employmentData] = await Promise.all([
        this.walkScore.getScores({ address: params.address, lat, lon }),
        this.weather.getCurrentWeather({ lat, lon }),
        this.fred.getMortgageRate(),
        this.fred.getHomePriceIndex(),
        params.countyFips
          ? this.bls.getUnemploymentRate(params.countyFips)
          : Promise.resolve<{ unemploymentRate?: number; laborForce?: number }>({}),
      ]);

      return {
        location: {
          lat,
          lon,
          // Explicitly set to null if reverse geocoding failed or data unavailable
          // This makes it clear when location details are missing vs undefined
          county: geoData.county ?? null,
          state: geoData.state ?? null,
          zipCode: geoData.zipCode ?? null,
        },
        walkability: {
          walkScore: walkabilityData.walkScore,
          transitScore: walkabilityData.transitScore,
          bikeScore: walkabilityData.bikeScore,
        },
        weather: {
          temp: weatherData.temp,
          humidity: weatherData.humidity,
          description: weatherData.description,
        },
        employment: {
          unemploymentRate: employmentData?.unemploymentRate,
          laborForce: employmentData?.laborForce,
        },
        economy: {
          mortgageRate: mortgageData.rate,
          homePriceIndex: homePriceData.index,
          homePriceChange: homePriceData.change1Year,
        },
      };
    } catch (error) {
      console.error('Market Data Service error:', error);
      return {};
    }
  }
}

// Export singleton instances
export const marketDataService = new MarketDataService();
export const walkScoreAPI = new WalkScoreAPI();
export const openWeatherMapAPI = new OpenWeatherMapAPI();
export const blsAPI = new BLSAPI();
export const fredAPI = new FREDAPI();
export const geocodingAPI = new GeocodingAPI();
