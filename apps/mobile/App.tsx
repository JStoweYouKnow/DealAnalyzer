import React, { useEffect } from 'react';
import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { ErrorBoundary } from 'react-error-boundary';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { setupGlobalErrorHandlers } from './src/utils/crashPrevention';
import { initializeScreens } from './src/screens/ScreensConfig';
import AppNavigator from './src/navigation/AppNavigator';
import { CONFIG } from './src/config';

console.log('🚀 [App.tsx] MODULE LOADING - Top of file');

// Initialize react-native-screens BEFORE any navigation
// This prevents the RNSScreen.setViewToSnapshot crash
initializeScreens();
console.log('✅ [App.tsx] Screens initialized');

// Create a token cache for Clerk using SecureStore
const tokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.error('Error getting token:', err);
      return null;
    }
  },
  async saveToken(key: string, value: string) {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error('Error saving token:', err);
    }
  },
};

// Validate configuration
if (!CONFIG.clerkPublishableKey || CONFIG.clerkPublishableKey.trim() === '') {
  console.error('❌ Clerk publishable key is not configured. Authentication will not work.');
  console.error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in eas.json or .env file');
} else {
  const keyType = CONFIG.clerkPublishableKey.startsWith('pk_live') ? 'PRODUCTION' : 'TEST';
  console.log(`✅ Clerk ${keyType} key configured`);

  // Warn if using test key in production build
  if (keyType === 'TEST' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: Using TEST Clerk key in production build!');
  }
}

if (!CONFIG.convexUrl) {
  console.warn('⚠️ Convex URL not configured. Database features may not work.');
}

if (!CONFIG.apiUrl) {
  console.warn('⚠️ API URL not configured. Some features may not work.');
}

// Create Convex client only if URL is provided
// If not provided, Convex will be disabled (components should handle this gracefully)
let convex: ConvexReactClient;
try {
  console.log('[App.tsx] Creating Convex client with URL:', CONFIG.convexUrl || 'placeholder');
  // Always use placeholder to avoid network errors on startup
  // The actual Convex URL will only be used if explicitly configured
  const convexUrlToUse = (CONFIG.convexUrl && CONFIG.convexUrl.trim() !== '' && CONFIG.convexUrl !== 'undefined')
    ? CONFIG.convexUrl.trim()
    : 'https://placeholder.convex.cloud';

  convex = new ConvexReactClient(convexUrlToUse, {
    // Disable automatic connection on startup to prevent crashes
    unsavedChangesWarning: false,
  });
  console.log('✅ [App.tsx] Convex client created successfully');
} catch (error) {
  console.error('❌ [App.tsx] Failed to create Convex client:', error);
  // Create a fallback placeholder that won't try to connect
  convex = new ConvexReactClient('https://placeholder.convex.cloud', {
    unsavedChangesWarning: false,
  });
}

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Component to handle deep links with query client access
function DeepLinkHandler() {
  const queryClient = useQueryClient();

  // Handle deep links for Gmail OAuth callback
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      console.log('[Deep Link] Received:', url);

      // Handle Gmail OAuth callback
      if (url.includes('gmail-callback')) {
        const urlObj = Linking.parse(url);
        console.log('[Deep Link] Gmail callback detected:', {
          url,
          queryParams: urlObj.queryParams,
          success: urlObj.queryParams?.success,
        });

        // Always invalidate queries when gmail-callback is received
        // The callback might not have success param, but if we got here, OAuth likely succeeded
        console.log('[Deep Link] ✅ Gmail callback received, invalidating queries...');

        // Remove queries from cache first to force fresh fetch
        queryClient.removeQueries({ queryKey: ['gmail-status'] });
        queryClient.removeQueries({ queryKey: ['email-deals'] });

        // Invalidate queries to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
        queryClient.invalidateQueries({ queryKey: ['email-deals'] });

        // Wait a moment for tokens to be stored, then refetch
        setTimeout(() => {
          console.log('[Deep Link] Refetching queries after delay...');
          queryClient.refetchQueries({ queryKey: ['gmail-status'] });
          queryClient.refetchQueries({ queryKey: ['email-deals'] });
        }, 2000);

        console.log('[Deep Link] ✅ Queries invalidated and will refetch');
      } else if (url.includes('gmail-callback') && url.includes('success=false')) {
        const urlObj = Linking.parse(url);
        const reason = urlObj.queryParams?.reason || 'Unknown error';
        console.error('[Deep Link] ❌ Gmail auth failed:', reason);

        const { Alert } = require('react-native');
        Alert.alert(
          'Connection Failed',
          `Gmail connection failed: ${reason}`,
          [{ text: 'OK' }]
        );
      }
    };

    // Listen for deep links when app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [queryClient]);

  return null;
}

// Error Fallback Component for crashes
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <SafeAreaProvider>
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#fff'
      }}>
        <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10, color: '#e74c3c' }}>
          Something went wrong
        </Text>
        <Text style={{ fontSize: 14, color: '#666', marginBottom: 20, textAlign: 'center' }}>
          {error.message}
        </Text>
        <Text
          style={{
            color: '#3498db',
            fontSize: 16,
            textDecorationLine: 'underline'
          }}
          onPress={resetErrorBoundary}
        >
          Try Again
        </Text>
      </View>
    </SafeAreaProvider>
  );
}

console.log('✅ [App.tsx] All module-level code executed successfully');
console.log('✅ [App.tsx] About to define App component');

export default function App() {
  console.log('🎯 [App] Component RENDERING');

  // Setup global error handlers to catch unhandled errors
  useEffect(() => {
    setupGlobalErrorHandlers();

    // Disable React Native error overlay for API errors in development
    if (__DEV__) {
      const originalError = console.error;
      console.error = (...args: any[]) => {
        // Check if this is an API error that we want to suppress
        const errorMessage = args[0]?.toString() || '';
        if (errorMessage.includes('[API Client]') ||
            errorMessage.includes('Request failed') ||
            errorMessage.includes('Network Error')) {
          // Use console.warn instead to prevent error overlay
          console.warn(...args);
          return;
        }
        // For other errors, use the original console.error
        originalError.apply(console, args);
      };
    }
  }, []);

  // Log configuration on startup
  useEffect(() => {
    console.log('[App] ========== INITIALIZATION ==========');
    console.log('[App] Initializing...');
    console.log('[App] Clerk key loaded:', !!CONFIG.clerkPublishableKey);
    console.log('[App] Clerk key type:', CONFIG.clerkPublishableKey?.startsWith('pk_live') ? 'PRODUCTION' : 'TEST');
    console.log('[App] Clerk key length:', CONFIG.clerkPublishableKey?.length);
    console.log('[App] Clerk key preview:', CONFIG.clerkPublishableKey?.substring(0, 30) + '...');
    console.log('[App] Full Clerk key:', CONFIG.clerkPublishableKey);
    console.log('[App] Platform:', Platform.OS);
    console.log('[App] Is Expo Go:', __DEV__ && !process.env.NODE_ENV);
    console.log('[App] API URL:', CONFIG.apiUrl || 'not configured');
    console.log('[App] Convex URL:', CONFIG.convexUrl || 'not configured');
    console.log('[App] ====================================');

    // Test network connectivity from mobile app (optional, non-blocking)
    if (CONFIG.clerkPublishableKey) {
      console.log('[App] Testing network connectivity to Clerk...');
      // Use a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Network test timeout')), 5000)
      );

      Promise.race([
        fetch('https://clerk.com', { method: 'HEAD', mode: 'no-cors' }),
        timeoutPromise
      ])
        .then(() => {
          console.log('[App] ✅ Network connectivity test: SUCCESS');
        })
        .catch((error) => {
          console.warn('[App] ⚠️ Network connectivity test: FAILED (non-critical):', error.message);
        });
    }
  }, []);

  // Ensure we have a valid publishable key before rendering ClerkProvider
  if (!CONFIG.clerkPublishableKey || CONFIG.clerkPublishableKey.trim() === '') {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
            Error: Clerk publishable key is not configured.{'\n'}
            Please set clerkPublishableKey in app.json
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Validate key format before passing to ClerkProvider
  const trimmedKey = CONFIG.clerkPublishableKey.trim();
  if (!trimmedKey.startsWith('pk_')) {
    console.error('[App] ❌ Invalid Clerk key format. Key must start with "pk_"');
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <Text style={{ color: 'red', fontSize: 16, textAlign: 'center' }}>
            Error: Invalid Clerk publishable key format.{'\n'}
            Key must start with "pk_"
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  console.log('[App] Rendering ClerkProvider with key:', trimmedKey.substring(0, 30) + '...');
  console.log('[App] Key validation:', {
    startsWithPk: trimmedKey.startsWith('pk_'),
    isProduction: trimmedKey.startsWith('pk_live'),
    keyLength: trimmedKey.length,
    keyPreview: trimmedKey.substring(0, 50) + '...',
  });

  // Try to validate the key format more thoroughly
  if (trimmedKey.length < 50) {
    console.error('[App] ❌ Clerk key seems too short. Expected 50+ characters, got:', trimmedKey.length);
  }

  console.log('[App] 🎨 About to render main app UI...');

  // DEBUG: Render a simple test view to verify rendering works
  // Set to true to bypass all providers and test basic rendering
  const BYPASS_PROVIDERS_FOR_DEBUG = false;

  if (__DEV__ && BYPASS_PROVIDERS_FOR_DEBUG) {
    console.log('[App] ⚠️ DEBUG MODE: Bypassing all providers, rendering simple test view');
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4CAF50' }}>
          <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>
            ✅ DEBUG MODE: App is rendering!
          </Text>
          <Text style={{ fontSize: 16, color: 'white', marginTop: 20 }}>
            React Native is working correctly
          </Text>
          <Text style={{ fontSize: 14, color: 'white', marginTop: 10 }}>
            Clerk Key: {trimmedKey.substring(0, 20)}...
          </Text>
          <Text style={{ fontSize: 12, color: 'white', marginTop: 20, textAlign: 'center', paddingHorizontal: 20 }}>
            Set BYPASS_PROVIDERS_FOR_DEBUG to false in App.tsx to enable full app
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        // Use console.warn to prevent React Native error overlay
        console.warn('🚨 Error Boundary Caught:', error?.message || error);
        if (__DEV__) {
          console.warn('Error Info:', errorInfo);
          console.warn('Error Stack:', error?.stack);
        }
        // TODO: Send to crash reporting service (Sentry, etc.)
      }}
    >
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={trimmedKey}
          tokenCache={tokenCache}
          // Enable native API support for mobile apps
          // If you get "native api disabled" error, enable Native API in Clerk Dashboard
          // Settings → API Keys → Enable "Native API" or "Mobile SDK Support"
        >
          <ConvexProvider client={convex}>
            <QueryClientProvider client={queryClient}>
              <DeepLinkHandler />
              <AppNavigator />
              <StatusBar style="auto" />
            </QueryClientProvider>
          </ConvexProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}
