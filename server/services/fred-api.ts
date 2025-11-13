/**
 * Federal Reserve Economic Data (FRED) API Service
 *
 * Completely FREE with API key - No rate limits!
 * Sign up: https://fred.stlouisfed.org/docs/api/api_key.html
 *
 * Popular real estate series:
 * - MORTGAGE30US: 30-Year Fixed Rate Mortgage Average
 * - CSUSHPINSA: S&P/Case-Shiller U.S. National Home Price Index
 * - HOUST: Housing Starts
 * - MSACSR: Monthly Supply of Houses in the U.S.
 */

import axios from 'axios';

const API_KEY = process.env.FRED_API_KEY;
const BASE_URL = 'https://api.stlouisfed.org/fred';

export interface MortgageRate {
  rate?: number;
  date?: string;
}

export interface HomePriceIndex {
  index?: number;
  date?: string;
  change1Year?: number;
  change6Month?: number;
}

export interface HousingStarts {
  starts?: number;
  date?: string;
  change1Year?: number;
}

export interface MonthsSupply {
  supply?: number;
  date?: string;
}

export const fredAPI = {
  /**
   * Get latest 30-year mortgage rate
   */
  async getMortgageRate(): Promise<MortgageRate> {
    if (!API_KEY) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${BASE_URL}/series/observations`, {
        params: {
          series_id: 'MORTGAGE30US',
          api_key: API_KEY,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
        timeout: 10000,
      });

      const latestData = response.data.observations?.[0];

      return {
        rate: latestData?.value && latestData.value !== '.' ? parseFloat(latestData.value) : undefined,
        date: latestData?.date,
      };
    } catch (error) {
      console.error('FRED mortgage rate API error:', error);
      return {};
    }
  },

  /**
   * Get S&P/Case-Shiller Home Price Index with year-over-year change
   */
  async getHomePriceIndex(): Promise<HomePriceIndex> {
    if (!API_KEY) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${BASE_URL}/series/observations`, {
        params: {
          series_id: 'CSUSHPINSA',
          api_key: API_KEY,
          file_type: 'json',
          sort_order: 'desc',
          limit: 13, // Get 13 months to calculate YoY and 6M changes
        },
        timeout: 10000,
      });

      const observations = response.data.observations;
      const latest = observations?.[0];
      const sixMonthsAgo = observations?.[6];
      const yearAgo = observations?.[12];

      let change1Year;
      let change6Month;

      if (latest?.value && latest.value !== '.' && yearAgo?.value && yearAgo.value !== '.') {
        const currentValue = parseFloat(latest.value);
        const pastValue = parseFloat(yearAgo.value);
        change1Year = ((currentValue - pastValue) / pastValue) * 100;
      }

      if (latest?.value && latest.value !== '.' && sixMonthsAgo?.value && sixMonthsAgo.value !== '.') {
        const currentValue = parseFloat(latest.value);
        const pastValue = parseFloat(sixMonthsAgo.value);
        change6Month = ((currentValue - pastValue) / pastValue) * 100;
      }

      return {
        index: latest?.value && latest.value !== '.' ? parseFloat(latest.value) : undefined,
        date: latest?.date,
        change1Year,
        change6Month,
      };
    } catch (error) {
      console.error('FRED home price index API error:', error);
      return {};
    }
  },

  /**
   * Get housing starts data
   */
  async getHousingStarts(): Promise<HousingStarts> {
    if (!API_KEY) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${BASE_URL}/series/observations`, {
        params: {
          series_id: 'HOUST',
          api_key: API_KEY,
          file_type: 'json',
          sort_order: 'desc',
          limit: 13, // Get 13 months for YoY calculation
        },
        timeout: 10000,
      });

      const observations = response.data.observations;
      const latest = observations?.[0];
      const yearAgo = observations?.[12];

      let change1Year;
      if (latest?.value && latest.value !== '.' && yearAgo?.value && yearAgo.value !== '.') {
        const currentValue = parseFloat(latest.value);
        const pastValue = parseFloat(yearAgo.value);
        change1Year = ((currentValue - pastValue) / pastValue) * 100;
      }

      return {
        starts: latest?.value && latest.value !== '.' ? parseFloat(latest.value) : undefined,
        date: latest?.date,
        change1Year,
      };
    } catch (error) {
      console.error('FRED housing starts API error:', error);
      return {};
    }
  },

  /**
   * Get months' supply of housing inventory
   */
  async getMonthsSupply(): Promise<MonthsSupply> {
    if (!API_KEY) {
      console.warn('FRED API key not configured');
      return {};
    }

    try {
      const response = await axios.get(`${BASE_URL}/series/observations`, {
        params: {
          series_id: 'MSACSR',
          api_key: API_KEY,
          file_type: 'json',
          sort_order: 'desc',
          limit: 1,
        },
        timeout: 10000,
      });

      const latestData = response.data.observations?.[0];

      return {
        supply: latestData?.value && latestData.value !== '.' ? parseFloat(latestData.value) : undefined,
        date: latestData?.date,
      };
    } catch (error) {
      console.error('FRED months supply API error:', error);
      return {};
    }
  },

  /**
   * Get all economic indicators at once
   */
  async getAllIndicators(): Promise<{
    mortgageRate?: MortgageRate;
    homePriceIndex?: HomePriceIndex;
    housingStarts?: HousingStarts;
    monthsSupply?: MonthsSupply;
  }> {
    const [mortgageRate, homePriceIndex, housingStarts, monthsSupply] = await Promise.all([
      this.getMortgageRate(),
      this.getHomePriceIndex(),
      this.getHousingStarts(),
      this.getMonthsSupply(),
    ]);

    return {
      mortgageRate,
      homePriceIndex,
      housingStarts,
      monthsSupply,
    };
  },
};
