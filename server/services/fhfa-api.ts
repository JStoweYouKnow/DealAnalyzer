/**
 * FHFA / FRED House Price Index Service
 *
 * Uses the Federal Reserve (FRED) API to retrieve FHFA House Price Index data
 * for each US state and compute price momentum metrics that can feed market
 * heat calculations.
 *
 * API Documentation: https://fred.stlouisfed.org/docs/api/fred/
 */

import NodeCache from 'node-cache';

const cache = new NodeCache({ stdTTL: 6 * 60 * 60 }); // 6 hours

const FRED_API_BASE = 'https://api.stlouisfed.org/fred/series/observations';

// Some state abbreviations differ from series IDs; override here when needed.
const STATE_SERIES_OVERRIDES: Record<string, string> = {
  DC: 'DC',
};

export interface StateHpiMetrics {
  state: string;
  latestDate: string;
  latestIndex: number;
  change1YearPercent?: number;
  change5YearPercent?: number;
  trendSlope?: number;
}

export class FhfaApiService {
  private apiKey: string;

  constructor() {
    if (!process.env.FRED_API_KEY) {
      console.warn('FRED_API_KEY not configured. FHFA price trend features are disabled.');
      this.apiKey = '';
    } else {
      this.apiKey = process.env.FRED_API_KEY;
    }
  }

  isConfigured(): boolean {
    return !!this.apiKey;
  }

  private getSeriesIdForState(state: string): string {
    const upper = state.toUpperCase();
    const suffix = STATE_SERIES_OVERRIDES[upper] ?? upper;
    return `STHPI${suffix}`;
  }

  private async fetchSeries(seriesId: string): Promise<any | null> {
    if (!this.apiKey) {
      return null;
    }

    const cacheKey = `fhfa_series_${seriesId}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const url = new URL(FRED_API_BASE);
    url.searchParams.append('series_id', seriesId);
    url.searchParams.append('api_key', this.apiKey);
    url.searchParams.append('file_type', 'json');
    // Retrieve 10 years of data to compute medium-term trend
    url.searchParams.append('observation_start', '2013-01-01');
    url.searchParams.append('frequency', 'quarterly');

    try {
      console.log(`[FHFA API] Fetching HPI series ${seriesId}`);
      const response = await fetch(url.toString());
      if (!response.ok) {
        const text = await response.text();
        console.error(`[FHFA API] ${seriesId} failed: ${response.status} ${text}`);
        return null;
      }
      const data = await response.json();
      cache.set(cacheKey, data);
      return data;
    } catch (error) {
      console.error('[FHFA API] Request failed:', error);
      return null;
    }
  }

  private computeMetrics(observations: Array<{ date: string; value: string }>, state: string): StateHpiMetrics | null {
    const numeric = observations
      .map((obs) => ({
        date: obs.date,
        value: parseFloat(obs.value),
      }))
      .filter((obs) => !Number.isNaN(obs.value));

    if (numeric.length === 0) {
      return null;
    }

    const latest = numeric[numeric.length - 1];
    const oneYearAgo = numeric.slice().reverse().find((obs) => {
      const latestDate = new Date(latest.date);
      const obsDate = new Date(obs.date);
      const diffMonths = (latestDate.getFullYear() - obsDate.getFullYear()) * 12 + (latestDate.getMonth() - obsDate.getMonth());
      return diffMonths >= 12 - 3 && diffMonths <= 12 + 3; // allow ~1 year tolerance
    });
    const fiveYearsAgo = numeric.slice().reverse().find((obs) => {
      const latestDate = new Date(latest.date);
      const obsDate = new Date(obs.date);
      const diffMonths = (latestDate.getFullYear() - obsDate.getFullYear()) * 12 + (latestDate.getMonth() - obsDate.getMonth());
      return diffMonths >= 60 - 6 && diffMonths <= 60 + 6;
    });

    const change1YearPercent =
      oneYearAgo && oneYearAgo.value > 0 ? ((latest.value - oneYearAgo.value) / oneYearAgo.value) * 100 : undefined;
    const change5YearPercent =
      fiveYearsAgo && fiveYearsAgo.value > 0 ? ((latest.value - fiveYearsAgo.value) / fiveYearsAgo.value) * 100 : undefined;

    // Basic linear trend using last 8 observations
    const recent = numeric.slice(-8);
    let trendSlope: number | undefined;
    if (recent.length >= 2) {
      const xs = recent.map((_, index) => index);
      const ys = recent.map((obs) => obs.value);
      const xMean = xs.reduce((a, b) => a + b, 0) / xs.length;
      const yMean = ys.reduce((a, b) => a + b, 0) / ys.length;
      const numerator = xs.reduce((sum, x, idx) => sum + (x - xMean) * (ys[idx] - yMean), 0);
      const denominator = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
      if (denominator !== 0) {
        trendSlope = numerator / denominator;
      }
    }

    return {
      state,
      latestDate: latest.date,
      latestIndex: latest.value,
      change1YearPercent,
      change5YearPercent,
      trendSlope,
    };
  }

  async getStateHpi(state: string): Promise<StateHpiMetrics | null> {
    if (!this.apiKey) {
      return null;
    }

    const seriesId = this.getSeriesIdForState(state);
    const data = await this.fetchSeries(seriesId);
    if (!data?.observations) {
      return null;
    }

    return this.computeMetrics(data.observations, state.toUpperCase());
  }
}

export const fhfaAPI = new FhfaApiService();

