/**
 * US Census Bureau API Service
 *
 * Provides demographics, income, population, and housing statistics
 * Free Tier: Unlimited requests
 *
 * API Documentation: https://www.census.gov/data/developers/data-sets.html
 */

import NodeCache from 'node-cache';

// Cache responses for 7 days (census data changes slowly)
const cache = new NodeCache({ stdTTL: 604800 });

const CENSUS_API_BASE = 'https://api.census.gov/data';

// ACS 5-Year Estimates (most comprehensive dataset)
const ACS5_YEAR = '2021/acs/acs5';

// Common variable codes
const CENSUS_VARIABLES = {
  // Population
  TOTAL_POPULATION: 'B01003_001E',

  // Income
  MEDIAN_HOUSEHOLD_INCOME: 'B19013_001E',
  PER_CAPITA_INCOME: 'B19301_001E',

  // Age
  MEDIAN_AGE: 'B01002_001E',

  // Education
  BACHELORS_OR_HIGHER: 'B15003_022E', // Bachelor's degree
  GRADUATE_DEGREE: 'B15003_023E', // Master's degree or higher

  // Housing
  MEDIAN_HOME_VALUE: 'B25077_001E',
  MEDIAN_GROSS_RENT: 'B25064_001E',
  TOTAL_HOUSING_UNITS: 'B25001_001E',
  OWNER_OCCUPIED: 'B25003_002E',
  RENTER_OCCUPIED: 'B25003_003E',

  // Employment
  UNEMPLOYMENT_RATE: 'B23025_005E',
  LABOR_FORCE: 'B23025_002E',
};

interface CensusDataResponse {
  data: {
    population?: number;
    medianHouseholdIncome?: number;
    perCapitaIncome?: number;
    medianAge?: number;
    medianHomeValue?: number;
    medianGrossRent?: number;
    totalHousingUnits?: number;
    ownerOccupied?: number;
    renterOccupied?: number;
    unemploymentRate?: number;
    educationLevel?: {
      bachelorsOrHigher?: number;
      graduateDegree?: number;
    };
  };
  zipCode: string;
}

export class CensusAPIService {
  private apiKey: string;

  constructor() {
    if (!process.env.CENSUS_API_KEY) {
      console.warn('CENSUS_API_KEY not configured. Census API features will not be available.');
      this.apiKey = '';
    } else {
      this.apiKey = process.env.CENSUS_API_KEY;
    }
  }

  private async makeRequest(
    dataset: string,
    variables: string[],
    geography: string
  ): Promise<any[] | null> {
    if (!this.apiKey) {
      console.warn('Census API key not configured');
      return null;
    }

    // Create cache key
    const cacheKey = `census_${dataset}_${variables.join(',')}_${geography}`;
    const cached = cache.get<any[]>(cacheKey);
    if (cached) {
      console.log(`[Census API] Cache hit`);
      return cached;
    }

    const url = new URL(`${CENSUS_API_BASE}/${dataset}`);
    url.searchParams.append('get', ['NAME', ...variables].join(','));
    url.searchParams.append('for', geography);
    url.searchParams.append('key', this.apiKey);

    try {
      console.log(`[Census API] Fetching data for ${geography}`);
      const response = await fetch(url.toString());

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Census API] Error ${response.status}: ${errorText}`);
        return null;
      }

      const data = await response.json();

      // Cache the response
      cache.set(cacheKey, data);
      console.log(`[Census API] Success`);

      return data;
    } catch (error) {
      console.error('[Census API] Request failed:', error);
      return null;
    }
  }

  /**
   * Get comprehensive demographic data for a zip code
   */
  async getZipCodeData(zipCode: string): Promise<CensusDataResponse | null> {
    const variables = [
      CENSUS_VARIABLES.TOTAL_POPULATION,
      CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME,
      CENSUS_VARIABLES.PER_CAPITA_INCOME,
      CENSUS_VARIABLES.MEDIAN_AGE,
      CENSUS_VARIABLES.MEDIAN_HOME_VALUE,
      CENSUS_VARIABLES.MEDIAN_GROSS_RENT,
      CENSUS_VARIABLES.TOTAL_HOUSING_UNITS,
      CENSUS_VARIABLES.OWNER_OCCUPIED,
      CENSUS_VARIABLES.RENTER_OCCUPIED,
      CENSUS_VARIABLES.UNEMPLOYMENT_RATE,
      CENSUS_VARIABLES.LABOR_FORCE,
      CENSUS_VARIABLES.BACHELORS_OR_HIGHER,
      CENSUS_VARIABLES.GRADUATE_DEGREE,
    ];

    const geography = `zip code tabulation area:${zipCode}`;

    const response = await this.makeRequest(ACS5_YEAR, variables, geography);

    if (!response || response.length < 2) {
      return null;
    }

    // First row is headers, second row is data
    const headers = response[0];
    const values = response[1];

    // Create a map of variable name to value
    const dataMap: Record<string, any> = {};
    headers.forEach((header: string, index: number) => {
      dataMap[header] = values[index];
    });

    // Parse unemployment rate (unemployed / labor force * 100)
    const unemployed = parseFloat(dataMap[CENSUS_VARIABLES.UNEMPLOYMENT_RATE]) || 0;
    const laborForce = parseFloat(dataMap[CENSUS_VARIABLES.LABOR_FORCE]) || 1;
    const unemploymentRate = laborForce > 0 ? (unemployed / laborForce) * 100 : 0;

    return {
      zipCode,
      data: {
        population: parseFloat(dataMap[CENSUS_VARIABLES.TOTAL_POPULATION]) || undefined,
        medianHouseholdIncome: parseFloat(dataMap[CENSUS_VARIABLES.MEDIAN_HOUSEHOLD_INCOME]) || undefined,
        perCapitaIncome: parseFloat(dataMap[CENSUS_VARIABLES.PER_CAPITA_INCOME]) || undefined,
        medianAge: parseFloat(dataMap[CENSUS_VARIABLES.MEDIAN_AGE]) || undefined,
        medianHomeValue: parseFloat(dataMap[CENSUS_VARIABLES.MEDIAN_HOME_VALUE]) || undefined,
        medianGrossRent: parseFloat(dataMap[CENSUS_VARIABLES.MEDIAN_GROSS_RENT]) || undefined,
        totalHousingUnits: parseFloat(dataMap[CENSUS_VARIABLES.TOTAL_HOUSING_UNITS]) || undefined,
        ownerOccupied: parseFloat(dataMap[CENSUS_VARIABLES.OWNER_OCCUPIED]) || undefined,
        renterOccupied: parseFloat(dataMap[CENSUS_VARIABLES.RENTER_OCCUPIED]) || undefined,
        unemploymentRate: unemploymentRate || undefined,
        educationLevel: {
          bachelorsOrHigher: parseFloat(dataMap[CENSUS_VARIABLES.BACHELORS_OR_HIGHER]) || undefined,
          graduateDegree: parseFloat(dataMap[CENSUS_VARIABLES.GRADUATE_DEGREE]) || undefined,
        },
      },
    };
  }

  /**
   * Get population for a city
   */
  async getCityPopulation(city: string, state: string): Promise<number | null> {
    const variables = [CENSUS_VARIABLES.TOTAL_POPULATION];
    const geography = `place:${city}&in=state:${state}`;

    const response = await this.makeRequest(ACS5_YEAR, variables, geography);

    if (!response || response.length < 2) {
      return null;
    }

    return parseFloat(response[1][1]) || null;
  }

  /**
   * Check if API is configured
   */
  isConfigured(): boolean {
    return !!this.apiKey;
  }
}

// Export singleton instance
export const censusAPI = new CensusAPIService();
