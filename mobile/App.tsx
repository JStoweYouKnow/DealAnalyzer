import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { View, Text, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { setupGlobalErrorHandlers } from './src/utils/crashPrevention';
import { initializeScreens } from './src/screens/ScreensConfig';

// Initialize react-native-screens BEFORE any navigation
// This prevents the RNSScreen.setViewToSnapshot crash
initializeScreens();

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
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import Constants from 'expo-constants';
import AppNavigator from './src/navigation/AppNavigator';

// Get environment variables (prioritize EXPO_PUBLIC_ env vars for security)
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.clerkPublishableKey || '';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ||
  Constants.expoConfig?.extra?.convexUrl || '';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl || '';

// Validate configuration
if (!clerkPublishableKey || clerkPublishableKey.trim() === '') {
  console.error('❌ Clerk publishable key is not configured. Authentication will not work.');
  console.error('Set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in eas.json or .env file');
} else {
  const keyType = clerkPublishableKey.startsWith('pk_live') ? 'PRODUCTION' : 'TEST';
  console.log(`✅ Clerk ${keyType} key configured`);

  // Warn if using test key in production build
  if (keyType === 'TEST' && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ WARNING: Using TEST Clerk key in production build!');
  }
}

if (!convexUrl) {
  console.warn('⚠️ Convex URL not configured. Database features may not work.');
}

if (!apiUrl) {
  console.warn('⚠️ API URL not configured. Some features may not work.');
}

// Export for use in other parts of the app
export const CONFIG = {
  clerkPublishableKey,
  convexUrl,
  apiUrl,
};

// Create Convex client only if URL is provided
// If not provided, Convex will be disabled (components should handle this gracefully)
const convex = convexUrl && convexUrl.trim() !== '' && convexUrl !== 'undefined'
  ? new ConvexReactClient(convexUrl.trim())
  : new ConvexReactClient('https://placeholder.convex.cloud'); // Placeholder to prevent errors

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

        // Show alert to user
        // We need to import Alert first, but since this is a functional component inside App.tsx
        // and App.tsx imports View, Text, Platform from react-native, we can use require or assume Alert is available
        // But App.tsx doesn't import Alert at top level. Let's rely on console error for now or add Alert import if possible
        // Actually simpler: just log it and maybe the UI will reflect "disconnected".
        // But better: show Alert.
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

export default function App() {
  // Setup global error handlers to catch unhandled errors
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);

  // Log configuration on startup
  useEffect(() => {
    console.log('[App] ========== INITIALIZATION ==========');
    console.log('[App] Initializing...');
    console.log('[App] Clerk key loaded:', !!clerkPublishableKey);
    console.log('[App] Clerk key type:', clerkPublishableKey?.startsWith('pk_live') ? 'PRODUCTION' : 'TEST');
    console.log('[App] Clerk key length:', clerkPublishableKey?.length);
    console.log('[App] Clerk key preview:', clerkPublishableKey?.substring(0, 30) + '...');
    console.log('[App] Full Clerk key:', clerkPublishableKey);
    console.log('[App] Platform:', Platform.OS);
    console.log('[App] Is Expo Go:', __DEV__ && !Constants.expoConfig?.ios?.bundleIdentifier);
    console.log('[App] ====================================');

    // Test network connectivity from mobile app
    if (clerkPublishableKey) {
      console.log('[App] Testing network connectivity to Clerk...');
      fetch('https://clerk.com', { method: 'HEAD', mode: 'no-cors' })
        .then(() => {
          console.log('[App] ✅ Network connectivity test: SUCCESS');
        })
        .catch((error) => {
          console.error('[App] ❌ Network connectivity test: FAILED', error);
        });
    }
  }, []);


  // Ensure we have a valid publishable key before rendering ClerkProvider
  if (!clerkPublishableKey || clerkPublishableKey.trim() === '') {
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
  const trimmedKey = clerkPublishableKey.trim();
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

  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('🚨 Error Boundary Caught:', error);
        console.error('Error Info:', errorInfo);
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
