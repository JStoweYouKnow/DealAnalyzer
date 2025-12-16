/**
 * Text Input Safety Utilities
 * Prevents crashes when text fields are unmounted while keyboard is active
 * Addresses crash #2 from crash point analysis
 */

import { Keyboard } from 'react-native';

/**
 * Dismiss keyboard safely before navigation or unmounting
 */
export const dismissKeyboardBeforeAction = async (
  action: () => void | Promise<void>,
  delay: number = 100
): Promise<void> => {
  try {
    // Dismiss keyboard first
    Keyboard.dismiss();
    
    // Wait a bit for keyboard to fully dismiss
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Then perform the action
    await action();
  } catch (error) {
    console.error('[TextInputSafety] Error in dismissKeyboardBeforeAction:', error);
    // Still try to perform action even if keyboard dismissal fails
    await action();
  }
};

/**
 * Safe text input unmount - ensures keyboard is dismissed
 */
export const safeUnmountTextInput = (componentRef: any) => {
  try {
    // Blur the input if it's focused
    if (componentRef?.current?.blur) {
      componentRef.current.blur();
    }
    
    // Dismiss keyboard
    Keyboard.dismiss();
    
    // Small delay to let keyboard dismiss complete
    setTimeout(() => {
      // Component can now safely unmount
    }, 150);
  } catch (error) {
    console.error('[TextInputSafety] Error in safeUnmountTextInput:', error);
  }
};

/**
 * Hook to dismiss keyboard on navigation
 * Use this in navigation listeners
 */
export const setupKeyboardDismissOnNavigation = (
  navigation: any,
  enabled: boolean = true
) => {
  if (!enabled) return () => {};

  const unsubscribe = navigation.addListener('beforeRemove', () => {
    // Dismiss keyboard before screen is removed
    Keyboard.dismiss();
  });

  return unsubscribe;
};

/**
 * Safe text input wrapper props
 * Use these props on all TextInput components
 */
export const safeTextInputProps = {
  blurOnSubmit: true,
  returnKeyType: 'done' as const,
  onSubmitEditing: () => {
    Keyboard.dismiss();
  },
};

/**
 * Enhanced safe text input props with custom handler
 */
export const getSafeTextInputProps = (onSubmit?: () => void) => ({
  ...safeTextInputProps,
  onSubmitEditing: () => {
    Keyboard.dismiss();
    onSubmit?.();
  },
});

/**
 * Prevent text input operations during unmounting
 */
let isUnmounting = false;

export const setUnmountingState = (state: boolean) => {
  isUnmounting = state;
};

export const isComponentUnmounting = () => isUnmounting;

/**
 * Safe text input focus - checks if component is unmounting
 */
export const safeFocus = (ref: any) => {
  if (isUnmounting) {
    console.warn('[TextInputSafety] Blocked focus - component unmounting');
    return false;
  }
  
  try {
    ref?.current?.focus();
    return true;
  } catch (error) {
    console.error('[TextInputSafety] Error focusing:', error);
    return false;
  }
};

/**
 * Safe text input blur - always safe to call
 */
export const safeBlur = (ref: any) => {
  try {
    ref?.current?.blur();
    Keyboard.dismiss();
    return true;
  } catch (error) {
    console.error('[TextInputSafety] Error blurring:', error);
    return false;
  }
};



