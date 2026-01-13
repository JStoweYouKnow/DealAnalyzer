import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

// Required for OAuth to work properly
WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });

  const handleSignIn = async () => {
    try {
      console.log('[SignIn] Starting OAuth flow...');
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId) {
        console.log('[SignIn] Session created:', createdSessionId);
        setActive?.({ session: createdSessionId });
      } else {
        console.log('[SignIn] No session created');
      }
    } catch (error) {
      console.error('[SignIn] Error:', error);
      Alert.alert('Sign In Error', 'Failed to sign in. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to Deal Analyzer</Text>
      <Text style={styles.subtitle}>Sign in to analyze real estate deals</Text>

      <TouchableOpacity style={styles.button} onPress={handleSignIn}>
        <Text style={styles.buttonText}>Sign In with Google</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4285F4',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  note: {
    marginTop: 24,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

