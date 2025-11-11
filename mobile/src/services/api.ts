import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Platform, Alert } from 'react-native';
import { navigateToTab } from '../navigation/navigationRef';

// Try to import expo-constants, fallback if not available
let Constants: any;
try {
  Constants = require('expo-constants');
} catch (e) {
  // expo-constants not available, will use fallbacks
  Constants = null;
}

/**
 * Get the development server URL with platform-aware fallbacks
 * 
 * Priority order:
 * 1. DEV_SERVER_URL environment variable (from .env or app.json extra)
 * 2. Platform-specific defaults:
 *    - Android Emulator: 'http://10.0.2.2:3000' (special IP for Android emulator)
 *    - iOS Simulator: 'http://localhost:3000'
 *    - Physical devices: 'http://localhost:3000' (fallback - should use DEV_SERVER_URL)
 * 
 * For physical devices, you MUST set DEV_SERVER_URL to your machine's LAN IP
 * (e.g., 'http://192.168.1.100:3000'). Find your IP with:
 * - macOS/Linux: `ifconfig | grep "inet " | grep -v 127.0.0.1`
 * - Windows: `ipconfig` (look for IPv4 Address)
 */
function getDevServerUrl(): string {
  // Check for explicit DEV_SERVER_URL from environment or app config
  const envUrl = 
    process.env.DEV_SERVER_URL || 
    (Constants?.expoConfig?.extra?.devServerUrl) ||
    (Constants?.manifest?.extra?.devServerUrl);
  
  if (envUrl) {
    return envUrl;
  }

  // Platform-specific fallbacks
  if (Platform.OS === 'android') {
    // Android emulator uses special IP to access host machine
    return 'http://10.0.2.2:3000';
  } else if (Platform.OS === 'ios') {
    // iOS simulator can use localhost
    return 'http://localhost:3000';
  }

  // Default fallback (should rarely be used)
  return 'http://localhost:3000';
}

// API Configuration
const API_URL = __DEV__
  ? getDevServerUrl()
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
          // Navigate to Settings screen (or Login if available)
          // To add a Login screen, update RootStackParamList in AppNavigator.tsx
          // and use: navigate('Login') instead
          try {
            // Safe navigation with error handling - navigateToTab already has guards,
            // but wrap in try-catch as additional safety layer to prevent interceptor crashes
            navigateToTab('Settings');
          } catch (navError) {
            // Swallow navigation errors to prevent interceptor from crashing
            // The navigateToTab function already handles errors internally,
            // but this provides an extra safety layer
            if (__DEV__) {
              console.warn('Failed to navigate to Settings on 401 error:', navError);
            }
          }
        } else if (error.response?.status === 429) {
          // Handle rate limiting - show user-friendly message
          Alert.alert(
            'Too Many Requests',
            'You\'ve made too many requests. Please wait a moment and try again.',
            [{ text: 'OK' }]
          );
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
