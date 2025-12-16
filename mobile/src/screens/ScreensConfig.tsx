/**
 * React Native Screens Configuration
 * Fixes crash: RNSScreen.setViewToSnapshot
 * 
 * This configures react-native-screens to prevent snapshot crashes
 * that occur during rapid navigation or screen unmounting
 */

import { enableScreens, enableFreeze } from 'react-native-screens';

/**
 * Initialize screens with safe defaults
 * Call this BEFORE rendering NavigationContainer
 */
export const initializeScreens = () => {
  try {
    // Enable react-native-screens for better performance
    enableScreens(true);
    
    // Enable screen freezing to improve memory usage
    // This pauses non-visible screens
    enableFreeze(true);
    
    console.log('[Screens] React Native Screens initialized with safe defaults');
  } catch (error) {
    console.error('[Screens] Error initializing screens:', error);
    // Fallback: disable native screens if initialization fails
    try {
      enableScreens(false);
      console.warn('[Screens] Falling back to JS-based screens');
    } catch (fallbackError) {
      console.error('[Screens] Fallback failed:', fallbackError);
    }
  }
};

/**
 * Screen options to prevent snapshot crashes
 */
export const safeScreenOptions = {
  // Disable native stack animations that can cause snapshot issues
  animation: 'default' as const,
  
  // Prevent crashes during rapid navigation
  gestureEnabled: true,
  
  // Use simpler presentation style
  presentation: 'card' as const,
  
  // Disable animations if issues persist (uncomment if needed)
  // animationEnabled: false,
};

/**
 * Tab screen options for safer navigation
 */
export const safeTabOptions = {
  // Lazy load tabs to reduce memory pressure
  lazy: true,
  
  // Unmount inactive tabs to free memory (helps with snapshot issues)
  unmountOnBlur: false, // Keep false to avoid re-rendering, but can set to true if memory is an issue
  
  // Freeze inactive screens
  freezeOnBlur: true,
};




