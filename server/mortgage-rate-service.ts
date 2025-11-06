/**
 * Service for fetching current mortgage rates from API Ninjas
 */

const API_NINJAS_API_KEY = process.env.API_NINJAS_API_KEY || 'U30sqfOKlZDcHzhkBGfSBA==6uHTEcCZeXWi2guq';
const API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1/mortgagerate';

// Consistent prefix for all mortgage rate cache keys
const MORTGAGE_RATE_CACHE_KEY_PREFIX = 'mortgage-rate-';

export interface MortgageRateParams {
  loan_term?: number; // Loan term in years (e.g., 30)
  loan_amount?: number; // Loan amount in dollars
  credit_score?: number; // Credit score (300-850)
  down_payment?: number; // Down payment in dollars
  zip_code?: string; // Zip code for location-based rates
}

export interface MortgageRateResponse {
  loan_term: number;
  rate: number; // Annual percentage rate (APR) - format may vary (percentage or decimal)
  apr?: number; // Alternative format for APR
  rate_format?: 'percent' | 'decimal'; // Optional metadata indicating format
  rate_unit?: string; // Optional metadata (e.g., 'percent', 'decimal')
}

import { mortgageRateCache, getCachedOrFetch } from '../app/lib/cache-service';

/**
 * Fetches current mortgage rate from API Ninjas
 * Uses caching to avoid excessive API calls
 */
export async function getMortgageRate(params?: MortgageRateParams): Promise<number> {
  // Create cache key from all parameters that affect the API response
  // Use default placeholders for missing values to ensure deterministic key generation
  const zip = params?.zip_code || 'null';
  const amount = params?.loan_amount?.toString() || 'null';
  const term = params?.loan_term?.toString() || 'null';
  const score = params?.credit_score?.toString() || 'null';
  const downPayment = params?.down_payment?.toString() || 'null';
  const cacheKey = `${MORTGAGE_RATE_CACHE_KEY_PREFIX}${zip}-${amount}-${term}-${score}-${downPayment}`;
  
  try {
    return await getCachedOrFetch(
      mortgageRateCache,
      cacheKey,
      async () => {
        // Build query parameters
        const queryParams = new URLSearchParams();
        if (params?.loan_term) queryParams.append('loan_term', params.loan_term.toString());
        if (params?.loan_amount) queryParams.append('loan_amount', params.loan_amount.toString());
        if (params?.credit_score) queryParams.append('credit_score', params.credit_score.toString());
        if (params?.down_payment) queryParams.append('down_payment', params.down_payment.toString());
        if (params?.zip_code) queryParams.append('zip_code', params.zip_code);

        const url = `${API_NINJAS_BASE_URL}${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
        
        console.log('Fetching mortgage rate from API Ninjas...');
        const response = await fetch(url, {
          headers: {
            'X-Api-Key': API_NINJAS_API_KEY,
          },
        });

        if (!response.ok) {
          throw new Error(`API Ninjas returned status ${response.status}`);
        }

        const data: MortgageRateResponse = await response.json();
        
        // Helper function to normalize rate to decimal format
        // Treat any numeric value > 1 as a percentage (divide by 100)
        // Leave values between 0 and 1 untouched (already decimal)
        function normalizeRate(value: number): number {
          // Handle invalid values
          if (isNaN(value) || !isFinite(value)) {
            console.error(
              `Invalid mortgage rate value ${value} from API (NaN or non-finite). ` +
              `Using default fallback of 0.07 (7%).`
            );
            return 0.07;
          }
          
          // Treat any numeric value > 1 as a percentage (divide by 100)
          // Leave values between 0 and 1 untouched (already decimal)
          if (value > 1) {
            return value / 100;
          } else if (value >= 0 && value <= 1) {
            return value;
          } else {
            // Unexpected value (negative) - log error and use fallback
            console.error(
              `Unexpected mortgage rate value ${value} from API (negative). ` +
              `Expected format: percentage (e.g., 7.0) or decimal (e.g., 0.07). ` +
              `Using default fallback of 0.07 (7%).`
            );
            return 0.07;
          }
        }
        
        // Extract rate - API may return 'rate' or 'apr'
        // Normalize both values if they exist, then pick the first available
        let rate: number | undefined;
        
        // Normalize data.rate if it exists
        if (data.rate !== undefined && data.rate !== null) {
          rate = normalizeRate(data.rate);
        }
        
        // Normalize data.apr if it exists and rate wasn't found
        if (rate === undefined && data.apr !== undefined && data.apr !== null) {
          rate = normalizeRate(data.apr);
        }
        
        // Use fallback if neither rate nor apr is available
        if (rate === undefined) {
          rate = 0.07; // Default fallback rate as decimal (7%)
        }
        
        const normalizedRate = rate;
        
        // Validate normalized rate is within sane range (0 < rate < 1) and is a valid number
        if (isNaN(normalizedRate) || !isFinite(normalizedRate)) {
          const errorMsg = `Normalized mortgage rate ${normalizedRate} is invalid (NaN or non-finite). ` +
                          `Original rate value: ${rate}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        if (normalizedRate <= 0 || normalizedRate >= 1) {
          const errorMsg = `Normalized mortgage rate ${normalizedRate} is out of valid range (expected: 0 < rate < 1). ` +
                          `Original rate value: ${rate}`;
          console.error(errorMsg);
          throw new Error(errorMsg);
        }
        
        // Additional validation: warn on unusually high or low rates
        if (normalizedRate > 0.15) {
          console.warn(`Unusually high mortgage rate detected: ${normalizedRate} (${normalizedRate * 100}%). ` +
                      `Original value: ${rate}. Please verify API response.`);
        }
        if (normalizedRate < 0.01) {
          console.warn(`Unusually low mortgage rate detected: ${normalizedRate} (${normalizedRate * 100}%). ` +
                      `Original value: ${rate}. Please verify API response.`);
        }

        console.log('Fetched mortgage rate:', normalizedRate, `(${normalizedRate * 100}%)`, 'from API Ninjas');
        return normalizedRate;
      },
      3600 // Cache for 1 hour
    );
  } catch (error) {
    console.error('Error fetching mortgage rate from API Ninjas:', error);
    console.warn('Falling back to default rate of 7% (0.07)');
    // Return default rate on error (fallback is not cached)
    return 0.07;
  }
}

/**
 * Clears the cached mortgage rate (useful for testing or forced refresh)
 * Only deletes keys matching the mortgage-rate- prefix to avoid evicting unrelated cache entries
 */
export function clearMortgageRateCache(): void {
  const keys = mortgageRateCache.keys();
  let deletedCount = 0;
  
  for (const key of keys) {
    if (typeof key === 'string' && key.startsWith(MORTGAGE_RATE_CACHE_KEY_PREFIX)) {
      mortgageRateCache.del(key);
      deletedCount++;
    }
  }
  
  if (deletedCount > 0) {
    console.log(`Cleared ${deletedCount} mortgage rate cache entr${deletedCount === 1 ? 'y' : 'ies'}`);
  }
}

