import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';

// Get API base URL from environment or use localhost for development
const getApiBaseUrl = (): string => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 
    process.env.EXPO_PUBLIC_API_URL;
  
  // Validate and return if provided (and not empty string)
  if (apiUrl && typeof apiUrl === 'string') {
    const trimmed = apiUrl.trim();
    if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
      // Ensure it's an absolute URL
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        return trimmed;
      }
      // If it doesn't have a protocol, add https://
      return `https://${trimmed}`;
    }
  }
  
  // Default to localhost for development
  // Note: For physical devices, use your computer's IP address instead of localhost
  // e.g., 'http://192.168.1.100:3002'
  if (__DEV__) {
    // Try to get the local IP from Constants, fallback to localhost
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      return `http://${debuggerHost}:3002`;
    }
    return 'http://localhost:3002';
  }
  
  // Production fallback
  console.warn('API URL not configured. Using localhost. Please set apiUrl in app.json extra section for production.');
  return 'http://localhost:3002';
};

// Check if API is configured
export const isApiConfigured = (): boolean => {
  const baseURL = getApiBaseUrl();
  return baseURL !== '' && 
         baseURL !== 'http://localhost:3002' || __DEV__;
};

// Create axios instance
const createApiClient = (getToken?: () => Promise<string | null>): AxiosInstance => {
  const baseURL = getApiBaseUrl();
  
  // Validate base URL
  if (!baseURL || (!baseURL.startsWith('http://') && !baseURL.startsWith('https://'))) {
    console.error('Invalid API base URL:', baseURL);
    throw new Error('API base URL must be an absolute URL starting with http:// or https://');
  }
  
  // Ensure baseURL doesn't have trailing slash
  const cleanBaseURL = baseURL.endsWith('/') ? baseURL.slice(0, -1) : baseURL;
  
  const client = axios.create({
    baseURL: cleanBaseURL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds
  });
  
  // Interceptor to add /api prefix to requests if using production URL
  client.interceptors.request.use((config) => {
    // If the URL doesn't start with /api and we're using a production URL (not localhost)
    if (config.url && !config.url.startsWith('/api') && !cleanBaseURL.includes('localhost')) {
      // Ensure URL starts with / before prepending /api
      const url = config.url.startsWith('/') ? config.url : `/${config.url}`;
      config.url = `/api${url}`;
    }
    return config;
  });

  // Add auth token to requests if available
  if (getToken) {
    client.interceptors.request.use(async (config) => {
      try {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('✅ Auth token added to request:', token.substring(0, 20) + '...');
        } else {
          console.warn('⚠️ No auth token available - user may not be signed in');
        }
      } catch (error) {
        console.error('❌ Failed to get auth token:', error);
      }
      return config;
    });
  }

  // Add user session ID from secure store
  client.interceptors.request.use(async (config) => {
    try {
      const sessionId = await SecureStore.getItemAsync('user-session-id');
      if (sessionId) {
        config.headers['x-user-session-id'] = sessionId;
      }
    } catch (error) {
      // Ignore errors
    }
    return config;
  });

  // Handle errors
  client.interceptors.response.use(
    (response) => response,
    async (error) => {
      if (error.response?.status === 401) {
        // Handle unauthorized - could redirect to login
        console.warn('Unauthorized request');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// Default API client (without auth token)
export const apiClient = createApiClient();

// Hook to get authenticated API client
export const useApiClient = () => {
  const { getToken } = useAuth();
  
  return createApiClient(async () => {
    try {
      return await getToken();
    } catch {
      return null;
    }
  });
};

// API request helper
export const apiRequest = async <T = any>(
  method: string,
  url: string,
  data?: any,
  client: AxiosInstance = apiClient,
  config?: any
): Promise<T> => {
  const response = await client.request({
    method,
    url,
    data,
    ...config,
  });
  return response.data;
};

// Validate URL is absolute
const validateUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/');
};

// Convenience methods with URL validation
export const api = {
  get: <T = any>(url: string, client?: AxiosInstance) => {
    if (!validateUrl(url) && !url.startsWith('/')) {
      return Promise.reject(new Error(`Invalid URL: ${url}. URL must be absolute or start with /`));
    }
    return apiRequest<T>('GET', url, undefined, client);
  },
  post: <T = any>(url: string, data?: any, client?: AxiosInstance, config?: any) => {
    if (!validateUrl(url) && !url.startsWith('/')) {
      return Promise.reject(new Error(`Invalid URL: ${url}. URL must be absolute or start with /`));
    }
    return apiRequest<T>('POST', url, data, client, config);
  },
  put: <T = any>(url: string, data?: any, client?: AxiosInstance) => {
    if (!validateUrl(url) && !url.startsWith('/')) {
      return Promise.reject(new Error(`Invalid URL: ${url}. URL must be absolute or start with /`));
    }
    return apiRequest<T>('PUT', url, data, client);
  },
  delete: <T = any>(url: string, client?: AxiosInstance) => {
    if (!validateUrl(url) && !url.startsWith('/')) {
      return Promise.reject(new Error(`Invalid URL: ${url}. URL must be absolute or start with /`));
    }
    return apiRequest<T>('DELETE', url, undefined, client);
  },
  patch: <T = any>(url: string, data?: any, client?: AxiosInstance) => {
    if (!validateUrl(url) && !url.startsWith('/')) {
      return Promise.reject(new Error(`Invalid URL: ${url}. URL must be absolute or start with /`));
    }
    return apiRequest<T>('PATCH', url, data, client);
  },
};

export default apiClient;
