import { enableScreens } from 'react-native-screens';

let screensInitialized = false;

/**
 * Initialize react-native-screens before any navigation is rendered.
 * This prevents the RNSScreen.setViewToSnapshot crash that can occur
 * when screens aren't initialized before navigation mounts.
 */
export function initializeScreens() {
  if (screensInitialized) {
    return;
  }
  
  try {
    // Temporarily disable native screens to avoid crash
    // This will use JS-based screens which are slower but more stable
    enableScreens(false);
    screensInitialized = true;
    console.log('[ScreensConfig] react-native-screens initialized with JS-based screens (native disabled to prevent crash)');
  } catch (error) {
    console.warn('[ScreensConfig] Failed to initialize screens:', error);
    // Don't throw - let the app continue with JS-based screens
  }
}
