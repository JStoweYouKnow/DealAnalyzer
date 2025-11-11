import axios, { AxiosInstance, AxiosResponse } from 'axios';

// API Configuration
const API_URL = __DEV__
  ? 'http://localhost:3000' // Development: your local server
  : 'https://comfort-finder-analyzer.vercel.app'; // Production: your deployed backend

/**
 * API Client for DealAnalyzer backend
 *
 * This client connects to the same backend as the web app,
 * allowing the mobile app to reuse all existing API routes.
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for auth tokens
    this.client.interceptors.request.use(
      (config) => {
        // TODO: Add Clerk auth token here
        // const token = await getAuthToken();
        // if (token) {
        //   config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          console.log('Unauthorized - redirect to login');
        } else if (error.response?.status === 429) {
          // Handle rate limiting
          console.log('Rate limited - please try again later');
        }
        return Promise.reject(error);
      }
    );
  }

  // Property Analysis
  async analyzeProperty(data: {
    emailContent: string;
    strMetrics?: string;
    monthlyExpenses?: Record<string, number>;
    fundingSource?: string;
    mortgageValues?: any;
  }): Promise<any> {
    const response = await this.client.post('/api/analyze', data);
    return response.data;
  }

  // File Upload and Analysis
  async analyzeFile(formData: FormData): Promise<any> {
    const response = await this.client.post('/api/analyze-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  // URL Extraction
  async extractPropertyFromUrl(url: string): Promise<any> {
    const response = await this.client.post('/api/extract-property-url', { url });
    return response.data;
  }

  // Email Deals
  async getEmailDeals(): Promise<any> {
    const response = await this.client.get('/api/email-deals');
    return response.data;
  }

  async getEmailDeal(id: string): Promise<any> {
    const response = await this.client.get(`/api/email-deals/${id}`);
    return response.data;
  }

  async analyzeEmailDeal(data: {
    dealId: string;
    emailContent: string;
    fundingSource?: string;
    mortgageValues?: any;
  }): Promise<any> {
    const response = await this.client.post('/api/analyze-email-deal', data);
    return response.data;
  }

  // Gmail Integration
  async getGmailStatus(): Promise<any> {
    const response = await this.client.get('/api/gmail-status');
    return response.data;
  }

  async syncEmails(): Promise<any> {
    const response = await this.client.post('/api/sync-emails');
    return response.data;
  }

  // Market Intelligence
  async getMarketStats(params: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<any> {
    const response = await this.client.get('/api/market/cached-stats', { params });
    return response.data;
  }

  async getComparableSales(params: {
    address: string;
    city: string;
    state: string;
    zipCode: string;
  }): Promise<any> {
    const response = await this.client.get('/api/market/comparable-sales', { params });
    return response.data;
  }

  // Property Search
  async searchProperties(query: string): Promise<any> {
    const response = await this.client.post('/api/search/natural-language', { query });
    return response.data;
  }

  // Mortgage Calculator
  async calculateMortgage(data: {
    propertyPrice: number;
    downPaymentPercent: number;
    interestRate: number;
    loanTermYears: number;
  }): Promise<any> {
    const response = await this.client.post('/api/mortgage-calculator', data);
    return response.data;
  }

  // Report Generation
  async generateReport(data: {
    propertyId: string;
    analysisId: string;
  }): Promise<any> {
    const response = await this.client.post('/api/generate-report', data);
    return response.data;
  }
}

export const api = new ApiClient();
export default api;
