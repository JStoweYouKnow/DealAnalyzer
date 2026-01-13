import axios from 'axios';
import { CONFIG } from '../config';
import type { EmailDeal, DealAnalysis } from '@dealanalyzer/types';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get auth token for API calls
// This should be called from a component that has access to useAuth hook
export async function getAuthToken(getTokenFn?: () => Promise<string | null>): Promise<string | null> {
  if (!getTokenFn) {
    return null;
  }
  try {
    const token = await getTokenFn();
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

// Email Deals API
export const emailDealsApi = {
  // Get all email deals
  async getAll(getTokenFn?: () => Promise<string | null>): Promise<EmailDeal[]> {
    const token = await getAuthToken(getTokenFn);
    const response = await apiClient.get('/api/email-deals', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },

  // Get single email deal
  async getById(id: string, getTokenFn?: () => Promise<string | null>): Promise<EmailDeal> {
    const token = await getAuthToken(getTokenFn);
    const response = await apiClient.get(`/api/email-deals/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data;
  },

  // Update email deal
  async update(
    id: string,
    updates: Partial<EmailDeal>,
    getTokenFn?: () => Promise<string | null>
  ): Promise<EmailDeal> {
    const token = await getAuthToken(getTokenFn);
    const response = await apiClient.put(`/api/email-deals/${id}`, updates, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    return response.data.data;
  },

  // Update monthly rent for an email deal
  async updateMonthlyRent(
    id: string,
    monthlyRent: number,
    getTokenFn?: () => Promise<string | null>
  ): Promise<EmailDeal> {
    // First get the current deal to preserve existing extractedProperty fields
    const currentDeal = await this.getById(id, getTokenFn);
    return this.update(
      id,
      {
        extractedProperty: {
          ...(currentDeal.extractedProperty || {}),
          monthlyRent,
        },
      },
      getTokenFn
    );
  },
};

// Report Generation API
export const reportApi = {
  // Generate PDF or CSV report
  async generateReport(
    dealIds: string[],
    format: 'pdf' | 'csv',
    getTokenFn?: () => Promise<string | null>,
    title?: string
  ): Promise<Blob> {
    const token = await getAuthToken(getTokenFn);
    const response = await apiClient.post(
      '/api/generate-report',
      {
        dealIds,
        format,
        title,
      },
      {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        responseType: 'blob',
      }
    );
    return response.data;
  },
};

// Analysis API
export const analysisApi = {
  // Get analysis by ID
  async getById(id: string, getTokenFn?: () => Promise<string | null>): Promise<DealAnalysis> {
    const token = await getAuthToken(getTokenFn);
    const response = await apiClient.get(`/api/persist-analysis?id=${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    // Handle both direct response and wrapped response
    return response.data.data || response.data;
  },
};

