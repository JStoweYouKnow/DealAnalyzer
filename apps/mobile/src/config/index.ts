import Constants from 'expo-constants';

// Get environment variables (prioritize EXPO_PUBLIC_ env vars for security)
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
  Constants.expoConfig?.extra?.clerkPublishableKey || '';

const convexUrl = process.env.EXPO_PUBLIC_CONVEX_URL ||
  Constants.expoConfig?.extra?.convexUrl || '';

const apiUrl = process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl || '';

// Export configuration object for use throughout the app
export const CONFIG = {
  clerkPublishableKey,
  convexUrl,
  apiUrl,
};
