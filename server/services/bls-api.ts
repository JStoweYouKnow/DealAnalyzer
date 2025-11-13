/**
 * Bureau of Labor Statistics (BLS) API Service
 *
 * Completely FREE - No API key required!
 * Daily limit: 500 queries
 * Docs: https://www.bls.gov/developers/api_signature_v2.htm
 */

import axios from 'axios';

const BASE_URL = 'https://api.bls.gov/publicAPI/v2';
const REGISTRATION_KEY = process.env.BLS_API_KEY || ''; // Optional - increases daily limit

export interface UnemploymentData {
  unemploymentRate?: number;
  unemployed?: number;
  employed?: number;
  laborForce?: number;
  year?: number;
  period?: string;
  periodName?: string;
}

export interface WageData {
  averageWeeklyWage?: number;
  year?: number;
  quarter?: string;
}

export const blsAPI = {
  /**
   * Get unemployment data for a county by FIPS code
   *
   * FIPS format: 5 digits (2-digit state + 3-digit county)
   * Example: Dallas County, TX = 48113
   *
   * Find FIPS: https://www.nrcs.usda.gov/wps/portal/nrcs/detail/national/home/?cid=nrcs143_013697
   */
  async getUnemploymentRate(countyFips: string): Promise<UnemploymentData> {
    try {
      // Validate FIPS code
      if (!countyFips || countyFips.length !== 5) {
        console.warn(`Invalid FIPS code: ${countyFips}`);
        return {};
      }

      // Build series IDs for Local Area Unemployment Statistics (LAUS)
      const seriesIds = [
        `LAUCN${countyFips}0000000003`, // Unemployment rate
        `LAUCN${countyFips}0000000004`, // Unemployed persons
        `LAUCN${countyFips}0000000005`, // Employed persons
        `LAUCN${countyFips}0000000006`, // Labor force
      ];

      const currentYear = new Date().getFullYear();

      const response = await axios.post(
        `${BASE_URL}/timeseries/data/`,
        {
          seriesid: seriesIds,
          startyear: currentYear - 1,
          endyear: currentYear,
          registrationkey: REGISTRATION_KEY,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        console.error('BLS API request failed:', response.data.message);
        return {};
      }

      const series = response.data.Results.series;

      // Helper to get most recent value
      const getMostRecent = (seriesId: string) => {
        const seriesData = series.find((s: any) => s.seriesID === seriesId);
        const latestData = seriesData?.data?.[0];
        return latestData?.value ? parseFloat(latestData.value) : undefined;
      };

      // Get period info from first series
      const firstSeries = series?.[0];
      const latestPeriod = firstSeries?.data?.[0];

      return {
        unemploymentRate: getMostRecent(seriesIds[0]),
        unemployed: getMostRecent(seriesIds[1]),
        employed: getMostRecent(seriesIds[2]),
        laborForce: getMostRecent(seriesIds[3]),
        year: latestPeriod?.year ? parseInt(latestPeriod.year) : undefined,
        period: latestPeriod?.period,
        periodName: latestPeriod?.periodName,
      };
          employed: getMostRecent(seriesIds[2]),
          laborForce: getMostRecent(seriesIds[3]),
        };
      }
      const latestPeriod = firstSeries.data[0];

      return {
        unemploymentRate: getMostRecent(seriesIds[0]),
        unemployed: getMostRecent(seriesIds[1]),
        employed: getMostRecent(seriesIds[2]),
        laborForce: getMostRecent(seriesIds[3]),
        year: latestPeriod?.year ? parseInt(latestPeriod.year) : undefined,
        period: latestPeriod?.period,
        periodName: latestPeriod?.periodName,
      };
    } catch (error) {
      console.error('BLS API error:', error);
      return {};
    }
  },

  /**
   * Get average wage data for an area
   *
   * Area codes vary by geography level:
   * - National: US000
   * - State: ST{FIPS} (e.g., ST48 for Texas)
   * - MSA: {MSA code}
   */
  async getAverageWages(areaCode: string): Promise<WageData> {
    try {
      // QCEW (Quarterly Census of Employment and Wages) series
      const seriesId = `ENU${areaCode}00500010`; // All industries, private sector

      const currentYear = new Date().getFullYear();

      const response = await axios.post(
        `${BASE_URL}/timeseries/data/`,
        {
          seriesid: [seriesId],
          startyear: currentYear - 1,
          endyear: currentYear,
          registrationkey: REGISTRATION_KEY,
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      if (response.data.status !== 'REQUEST_SUCCEEDED') {
        return {};
      }

      // Defensive check: verify Results, series exist and have elements
      if (!response.data?.Results?.series || response.data.Results.series.length === 0) {
        console.warn('BLS wage API: No series data returned');
        return {};
      }

      const series = response.data.Results.series[0];
      
      // Defensive check: verify data array exists and has elements
      if (!series?.data || series.data.length === 0) {
        console.warn('BLS wage API: No data points in series');
        return {};
      }

      const latestData = series.data[0];

      return {
        averageWeeklyWage: latestData?.value ? parseFloat(latestData.value) : undefined,
        year: latestData?.year ? parseInt(latestData.year) : undefined,
        quarter: latestData?.period,
      };
    } catch (error) {
      console.error('BLS wage API error:', error);
      return {};
    }
  },

  /**
   * Convert county name to FIPS code (requires external service or lookup table)
   * This is a helper function - in production, use a FIPS lookup table
   */
  async countyToFips(county: string, state: string): Promise<string | null> {
    // This would require a FIPS lookup table or geocoding service
    // For now, return null and let caller provide FIPS directly
    console.warn('FIPS lookup not implemented - provide FIPS code directly');
    return null;
  },
};
