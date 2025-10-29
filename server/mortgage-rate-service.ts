/**
 * Service for fetching current mortgage rates from API Ninjas
 */

const API_NINJAS_API_KEY = process.env.API_NINJAS_API_KEY || 'U30sqfOKlZDcHzhkBGfSBA==6uHTEcCZeXWi2guq';
const API_NINJAS_BASE_URL = 'https://api.api-ninjas.com/v1/mortgagerate';

export interface MortgageRateParams {
  loan_term?: number; // Loan term in years (e.g., 30)
  loan_amount?: number; // Loan amount in dollars
  credit_score?: number; // Credit score (300-850)
  down_payment?: number; // Down payment in dollars
  zip_code?: string; // Zip code for location-based rates
}

export interface MortgageRateResponse {
  loan_term: number;
  rate: number; // Annual percentage rate (APR) as decimal (e.g., 0.07 for 7%)
  apr?: number; // Alternative format for APR
}

// Cache for rate to avoid excessive API calls
let cachedRate: { rate: number; timestamp: number } | null = null;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

/**
 * Fetches current mortgage rate from API Ninjas
 * Uses caching to avoid excessive API calls
 */
export async function getMortgageRate(params?: MortgageRateParams): Promise<number> {
  // Return cached rate if still valid
  if (cachedRate && Date.now() - cachedRate.timestamp < CACHE_DURATION) {
    console.log('Using cached mortgage rate:', cachedRate.rate);
    return cachedRate.rate;
  }

  try {
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
    
    // Extract rate - API may return 'rate' or 'apr'
    let rate = data.rate ?? data.apr ?? 7.0;
    
    // API returns rate as percentage (e.g., 7.0 for 7%), convert to decimal (0.07)
    // If rate is already in decimal format (< 1), use as-is; otherwise divide by 100
    const normalizedRate = rate < 1 ? rate : rate / 100;

    // Cache the rate
    cachedRate = {
      rate: normalizedRate,
      timestamp: Date.now(),
    };

    console.log('Fetched mortgage rate:', normalizedRate, 'from API Ninjas');
    return normalizedRate;
  } catch (error) {
    console.error('Error fetching mortgage rate from API Ninjas:', error);
    console.warn('Falling back to default rate of 7% (0.07)');
    
    // Return default rate on error
    return 0.07;
  }
}

/**
 * Clears the cached mortgage rate (useful for testing or forced refresh)
 */
export function clearMortgageRateCache(): void {
  cachedRate = null;
}

