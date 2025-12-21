import axios, { AxiosInstance } from 'axios';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { useAuth } from '@clerk/clerk-expo';

// Get API base URL from environment or use localhost for development
const getApiBaseUrl = (): string => {
  const apiUrl = Constants.expoConfig?.extra?.apiUrl || 
    process.env.EXPO_PUBLIC_API_URL;
  
  // Log configuration for debugging
  console.log('[API Config] Checking API URL configuration:', {
    fromExtra: Constants.expoConfig?.extra?.apiUrl,
    fromEnv: process.env.EXPO_PUBLIC_API_URL,
    isDev: __DEV__,
  });
  
  // Validate and return if provided (and not empty string)
  if (apiUrl && typeof apiUrl === 'string') {
    const trimmed = apiUrl.trim();
    if (trimmed !== '' && trimmed !== 'undefined' && trimmed !== 'null') {
      // Ensure it's an absolute URL
      if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        console.log('[API Config] ✅ Using configured API URL:', trimmed);
        return trimmed;
      }
      // If it doesn't have a protocol, add https://
      const urlWithProtocol = `https://${trimmed}`;
      console.log('[API Config] ✅ Using configured API URL (added https://):', urlWithProtocol);
      return urlWithProtocol;
    }
  }
  
  // Default to localhost for development
  // Note: For physical devices, use your computer's IP address instead of localhost
  // e.g., 'http://192.168.1.100:3002'
  if (__DEV__) {
    // Try to get the local IP from Constants, fallback to localhost
    const debuggerHost = Constants.expoConfig?.hostUri?.split(':')[0];
    if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
      const localUrl = `http://${debuggerHost}:3002`;
      console.warn('[API Config] ⚠️ Using localhost with debugger host:', localUrl);
      console.warn('[API Config] ⚠️ This may not work on physical devices. Set EXPO_PUBLIC_API_URL in .env.local');
      return localUrl;
    }
    const localhostUrl = 'http://localhost:3002';
    console.warn('[API Config] ⚠️ Using localhost:', localhostUrl);
    console.warn('[API Config] ⚠️ This will NOT work on physical devices. Set EXPO_PUBLIC_API_URL in .env.local');
    return localhostUrl;
  }
  
  // Production fallback - this is an error condition
  console.error('[API Config] ❌ API URL not configured for production!');
  console.error('[API Config] Set apiUrl in app.json extra section or EXPO_PUBLIC_API_URL in eas.json');
  throw new Error('API URL not configured. Please set apiUrl in app.json or EXPO_PUBLIC_API_URL environment variable.');
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
    timeout: 120000, // 120 seconds (increased for email sync operations)
    withCredentials: true, // Include cookies in cross-origin requests
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
      // Log detailed error information
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error')) {
        console.error('[API Error] ❌ Server not found or connection refused');
        console.error('[API Error] Base URL:', cleanBaseURL);
        console.error('[API Error] Request URL:', error.config?.url);
        console.error('[API Error] Full URL:', `${cleanBaseURL}${error.config?.url}`);
        console.error('[API Error] Error code:', error.code);
        console.error('[API Error] Error message:', error.message);
        console.error('[API Error] This usually means:');
        console.error('  1. API server is not running');
        console.error('  2. API URL is incorrect');
        console.error('  3. Network connectivity issue');
        console.error('  4. Firewall blocking the connection');
        console.error('[API Error] Check your API URL configuration in app.json or .env.local');
      } else if (error.response?.status === 401) {
        // Handle unauthorized - could redirect to login
        console.warn('[API Error] Unauthorized request (401)');
      } else if (error.response) {
        // Server responded with error status
        console.error('[API Error] Server error:', {
          status: error.response.status,
          statusText: error.response.statusText,
          url: error.config?.url,
        });
      } else if (error.request) {
        // Request was made but no response received
        console.error('[API Error] No response received:', {
          url: error.config?.url,
          baseURL: cleanBaseURL,
        });
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
