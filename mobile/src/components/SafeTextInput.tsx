/**
 * SafeTextInput Component
 * Wraps React Native TextInput with crash prevention
 * Prevents crashes when unmounted while keyboard is active
 */

import React, { useRef, useEffect } from 'react';
import { TextInput, TextInputProps, Keyboard } from 'react-native';

interface SafeTextInputProps extends TextInputProps {
  // Additional props can be added here
}

/**
 * Safe TextInput that automatically handles keyboard dismissal
 * and prevents crashes during unmounting
 */
export const SafeTextInput = React.forwardRef<TextInput, SafeTextInputProps>(
  ({ onSubmitEditing, blurOnSubmit = true, returnKeyType = 'done', ...props }, ref) => {
    const internalRef = useRef<TextInput>(null);
    const textInputRef = (ref as React.RefObject<TextInput>) || internalRef;

    // Handle unmounting - dismiss keyboard
    useEffect(() => {
      return () => {
        // Dismiss keyboard when component unmounts
        try {
          if (textInputRef?.current?.blur) {
            textInputRef.current.blur();
          }
          Keyboard.dismiss();
        } catch (error) {
          // Silently fail if already unmounted
          console.warn('[SafeTextInput] Error during unmount cleanup:', error);
        }
      };
    }, []);

    // Enhanced onSubmitEditing that dismisses keyboard
    const handleSubmitEditing = (e: any) => {
      Keyboard.dismiss();
      onSubmitEditing?.(e);
    };

    return (
      <TextInput
        {...props}
        ref={textInputRef}
        blurOnSubmit={blurOnSubmit}
        returnKeyType={returnKeyType}
        onSubmitEditing={handleSubmitEditing}
      />
    );
  }
);

SafeTextInput.displayName = 'SafeTextInput';

export default SafeTextInput;

