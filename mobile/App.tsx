import 'react-native-url-polyfill/auto';
import { StatusBar } from 'expo-status-bar';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/clerk-expo';
import * as SecureStore from 'expo-secure-store';

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

// Get Clerk publishable key from environment
const clerkPublishableKey = Constants.expoConfig?.extra?.clerkPublishableKey || 
  process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

// Get Convex URL from environment
const convexUrl = Constants.expoConfig?.extra?.convexUrl || 
  process.env.EXPO_PUBLIC_CONVEX_URL || '';

// Validate Clerk key
if (!clerkPublishableKey || clerkPublishableKey.trim() === '') {
  console.error('❌ Clerk publishable key is not configured. Authentication will not work.');
  console.error('Please set clerkPublishableKey in app.json extra section.');
} else {
  console.log('✅ Clerk publishable key is configured');
}

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

export default function App() {
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

  return (
    <SafeAreaProvider>
      <ClerkProvider 
        publishableKey={clerkPublishableKey.trim()}
        tokenCache={tokenCache}
      >
        <ConvexProvider client={convex}>
          <QueryClientProvider client={queryClient}>
            <AppNavigator />
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ConvexProvider>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
