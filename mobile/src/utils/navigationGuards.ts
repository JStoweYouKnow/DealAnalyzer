/**
 * Navigation Guards - Prevent crashes from rapid navigation
 * Addresses the RNSScreen snapshot crash identified in crash log
 */

import { NavigationContainerRef, CommonActions } from '@react-navigation/native';

let isNavigating = false;
let navigationTimeout: NodeJS.Timeout | null = null;

/**
 * Safe navigation wrapper that prevents rapid successive navigations
 * This fixes the crash in RNSScreen.setViewToSnapshot
 */
export const safeNavigate = (
  navigation: NavigationContainerRef<any> | any,
  routeName: string,
  params?: any
) => {
  // Prevent navigation if one is already in progress
  if (isNavigating) {
    console.warn('[Navigation] Blocked rapid navigation to:', routeName);
    return false;
  }

  try {
    isNavigating = true;
    
    // Clear any existing timeout
    if (navigationTimeout) {
      clearTimeout(navigationTimeout);
    }

    // Navigate
    navigation.navigate(routeName, params);

    // Reset navigation lock after a short delay
    navigationTimeout = setTimeout(() => {
      isNavigating = false;
    }, 500); // 500ms cooldown

    return true;
  } catch (error) {
    console.error('[Navigation] Error navigating to', routeName, error);
    isNavigating = false;
    return false;
  }
};

/**
 * Safe reset navigation - useful for auth flows
 */
export const safeReset = (
  navigation: NavigationContainerRef<any> | any,
  routeName: string,
  params?: any
) => {
  if (isNavigating) {
    console.warn('[Navigation] Blocked rapid reset navigation');
    return false;
  }

  try {
    isNavigating = true;

    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: routeName, params }],
      })
    );

    setTimeout(() => {
      isNavigating = false;
    }, 500);

    return true;
  } catch (error) {
    console.error('[Navigation] Error resetting navigation:', error);
    isNavigating = false;
    return false;
  }
};

/**
 * Safe goBack with validation
 */
export const safeGoBack = (navigation: any) => {
  if (isNavigating) {
    console.warn('[Navigation] Blocked rapid goBack');
    return false;
  }

  try {
    if (navigation.canGoBack()) {
      isNavigating = true;
      navigation.goBack();
      
      setTimeout(() => {
        isNavigating = false;
      }, 500);
      
      return true;
    } else {
      console.warn('[Navigation] Cannot go back - no previous screen');
      return false;
    }
  } catch (error) {
    console.error('[Navigation] Error going back:', error);
    isNavigating = false;
    return false;
  }
};

/**
 * Debounced navigation - prevents multiple rapid calls
 */
let debounceTimer: NodeJS.Timeout | null = null;

export const debouncedNavigate = (
  navigation: any,
  routeName: string,
  params?: any,
  delay: number = 300
) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }

  debounceTimer = setTimeout(() => {
    safeNavigate(navigation, routeName, params);
  }, delay);
};

/**
 * Hook up to navigation container for additional safety
 */
export const setupNavigationGuards = (navigationRef: NavigationContainerRef<any>) => {
  // Log all navigation state changes
  return navigationRef.addListener('state', (e) => {
    const state = navigationRef.getCurrentRoute();
    console.log('[Navigation] Current route:', state?.name);
  });
};




