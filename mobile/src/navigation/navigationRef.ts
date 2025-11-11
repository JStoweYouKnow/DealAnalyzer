import { createNavigationContainerRef, CommonActions } from '@react-navigation/native';
import { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params?: any) {
  try {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.navigate(name as any, params);
    }
  } catch (error) {
    // Silently handle navigation errors to prevent crashes
    if (__DEV__) {
      console.warn('Navigation error:', error);
    }
  }
}

// Helper to navigate to nested tab screens
export function navigateToTab(tabName: 'Home' | 'Deals' | 'Market' | 'Search' | 'Settings') {
  try {
    // Guard: Check if navigationRef exists and is ready before navigating
    if (navigationRef != null && navigationRef.isReady()) {
      navigationRef.dispatch(
        CommonActions.navigate({
          name: 'MainTabs',
          params: {
            screen: tabName,
          },
        })
      );
    } else {
      // Navigation not ready - log in dev mode but don't crash
      if (__DEV__) {
        console.warn(`Navigation not ready, skipping navigation to ${tabName} tab`);
      }
    }
  } catch (error) {
    // Swallow navigation errors to prevent interceptor crashes
    // Log in dev mode for debugging
    if (__DEV__) {
      console.error('Error navigating to tab:', error);
    }
  }
}

