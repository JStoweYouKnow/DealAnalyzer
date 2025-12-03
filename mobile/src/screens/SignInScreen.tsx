import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useAuth, useSignIn, useClerk } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignInScreen() {
  const { setActive: setActiveFromAuth, isLoaded, isSignedIn } = useAuth();
  const clerk = useClerk();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  
  // Try to get setActive from multiple sources
  const setActive = setActiveFromAuth || clerk?.setActive || (clerk as any)?.__internal_setActive;
  
  // Log setActive availability
  useEffect(() => {
    if (isLoaded) {
      console.log('[SignIn] setActive from useAuth:', typeof setActiveFromAuth === 'function');
      console.log('[SignIn] setActive from useClerk:', typeof clerk?.setActive === 'function');
      console.log('[SignIn] Final setActive available:', typeof setActive === 'function');
      if (!setActive) {
        console.error('[SignIn] ❌ setActive is NOT available - sign in will fail!');
      }
    }
  }, [isLoaded, setActiveFromAuth, clerk, setActive]);
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Get Clerk key for debugging
  const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  useEffect(() => {
    console.log('SignInScreen - Auth state:', { 
      isLoaded, 
      isSignedIn, 
      signInLoaded,
      hasSignIn: !!signIn,
      signInType: typeof signIn,
      signInKeys: signIn ? Object.keys(signIn) : 'N/A'
    });
    
    if (isLoaded && signInLoaded && !signIn) {
      console.error('⚠️ Clerk is loaded but signIn is not available. This may indicate a configuration issue.');
    }
  }, [isLoaded, isSignedIn, signInLoaded, signIn]);

  const handleSignIn = async () => {
    if (!isLoaded || !signInLoaded) {
      Alert.alert('Error', 'Authentication is not ready. Please wait a moment and try again.');
      return;
    }

    if (!signIn) {
      Alert.alert('Error', 'Sign in service is not available. Please restart the app.');
      console.error('signIn is undefined:', { isLoaded, signInLoaded, isSignedIn, signIn });
      return;
    }

    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      console.log('Attempting to sign in with email:', email);
      console.log('signIn object available:', !!signIn);
      console.log('Clerk publishable key:', clerkPublishableKey?.substring(0, 20) + '...');
      
      if (!signIn.create) {
        throw new Error('signIn.create is not available. Clerk may not be properly initialized.');
      }

      // Create the sign-in attempt with identifier and password
      // Clerk requires both for password-based authentication
      console.log('Creating sign-in attempt for:', email.trim());
      console.log('Using Clerk key:', clerkPublishableKey?.substring(0, 30) + '...');
      
      const createResult = await signIn.create({
        identifier: email.trim(),
        password: password,
      });

      console.log('Sign in create result:', {
        status: createResult?.status,
        _status: (createResult as any)?._status,
        identifier: (createResult as any)?.identifier,
        supportedFirstFactors: (createResult as any)?.supportedFirstFactors,
        firstFactorVerification: (createResult as any)?.firstFactorVerification,
      });

      // Check for errors first
      const firstFactor = (createResult as any)?.firstFactorVerification;
      if (firstFactor?.error) {
        const errorMsg = firstFactor.error.message || firstFactor.error.longMessage || firstFactor.error.code || 'Sign in failed';
        console.error('❌ Sign in error from firstFactorVerification:', errorMsg);
        throw new Error(errorMsg);
      }

      // If status is null or undefined, the sign-in attempt wasn't created properly
      if (createResult.status === null || createResult.status === undefined) {
        console.error('❌ Sign in result has no status. This usually means:');
        console.error('   1. Account does not exist in this Clerk instance');
        console.error('   2. Email/identifier is incorrect');
        console.error('   3. Clerk instance configuration issue');
        throw new Error('Account not found. Please check your email or sign up for a new account.');
      }

      // Check if we need to attempt first factor (password verification)
      if (createResult.status === 'needs_first_factor') {
        console.log('Password verification required, attempting first factor...');
        
        // Get the supported strategies
        const supportedFactors = (createResult as any)?.supportedFirstFactors || [];
        console.log('Supported first factors:', supportedFactors);
        
        // Find password strategy
        const passwordStrategy = supportedFactors.find((f: any) => f.strategy === 'password');
        if (!passwordStrategy) {
          throw new Error('Password authentication not available. Please contact support.');
        }
        
        // Attempt password verification
        const attemptResult = await signIn.attemptFirstFactor({
          strategy: 'password',
          password,
        });

        console.log('First factor attempt result:', {
          status: attemptResult?.status,
          createdSessionId: attemptResult?.createdSessionId,
        });

        // Check for errors in attempt
        const attemptFirstFactor = (attemptResult as any)?.firstFactorVerification;
        if (attemptFirstFactor?.error) {
          const errorMsg = attemptFirstFactor.error.message || attemptFirstFactor.error.longMessage || 'Password verification failed';
          console.error('❌ Password verification error:', errorMsg);
          throw new Error(errorMsg);
        }

        if (attemptResult.status === 'complete') {
          console.log('✅ Sign in complete after password verification');
          if (!attemptResult.createdSessionId) {
            throw new Error('Session ID not created after verification. Please try again.');
          }
          await setActive({ session: attemptResult.createdSessionId });
          console.log('✅ Session activated successfully');
          return; // Success, exit early
        } else {
          throw new Error(`Password verification incomplete. Status: ${attemptResult.status}`);
        }
      }

      if (createResult.status === 'complete') {
        console.log('✅ Sign in complete, setting active session');
        if (!createResult.createdSessionId) {
          throw new Error('Session ID not created. Please try again.');
        }
        await setActive({ session: createResult.createdSessionId });
        console.log('✅ Session activated successfully');
        // Navigation will automatically switch to MainTabs
      } else {
        console.warn('⚠️ Sign in incomplete. Status:', createResult.status);
        Alert.alert('Error', `Sign in incomplete. Status: ${createResult.status}`);
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      let errorMessage = error.errors?.[0]?.message || error.message || 
                         'Failed to sign in. Please check your credentials and try again.';
      
      // Make error messages more user-friendly
      if (errorMessage.includes("Couldn't find your account") || 
          errorMessage.includes("Couldn't find account")) {
        errorMessage = "Account not found. Please check your email or sign up for a new account.";
      } else if (errorMessage.includes("password") || errorMessage.includes("incorrect")) {
        errorMessage = "Incorrect password. Please try again or reset your password.";
      }
      
      Alert.alert('Sign In Failed', errorMessage, [
        {
          text: 'OK',
          style: 'default',
        },
        errorMessage.includes("Account not found") ? {
          text: 'Sign Up',
          onPress: () => navigation.navigate('SignUp'),
        } : undefined,
      ].filter(Boolean));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.form}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />

            {(!isLoaded || !signInLoaded) && (
              <View style={styles.warningContainer}>
                <Text style={styles.warningText}>
                  Loading authentication...
                </Text>
              </View>
            )}
            
            {isLoaded && signInLoaded && !signIn && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>
                  Authentication service unavailable. Please restart the app.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                (loading || !isLoaded || !signInLoaded || !signIn) && styles.buttonDisabled
              ]}
              onPress={handleSignIn}
              disabled={loading || !isLoaded || !signInLoaded || !signIn}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => navigation.navigate('SignUp')}
            >
              <Text style={styles.linkText}>
                Don't have an account? Sign up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#000000',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  warningText: {
    color: '#856404',
    fontSize: 14,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: '#F8D7DA',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorText: {
    color: '#721C24',
    fontSize: 14,
    textAlign: 'center',
  },
});

