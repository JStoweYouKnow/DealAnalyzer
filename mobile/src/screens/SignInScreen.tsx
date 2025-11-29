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
import { useAuth, useSignIn } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignInScreen() {
  const { setActive, isLoaded, isSignedIn } = useAuth();
  const { signIn, isLoaded: signInLoaded } = useSignIn();
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
      console.log('signIn object:', signIn);
      
      if (!signIn.create) {
        throw new Error('signIn.create is not available. Clerk may not be properly initialized.');
      }

      const result = await signIn.create({
        identifier: email.trim(),
        password,
      });

      console.log('Sign in result status:', result.status);

      if (result.status === 'complete') {
        console.log('Sign in complete, setting active session');
        await setActive({ session: result.createdSessionId });
        console.log('Session activated successfully');
        // Navigation will automatically switch to MainTabs
      } else if (result.status === 'needs_first_factor') {
        // Handle multi-factor authentication if needed
        Alert.alert('Additional Verification', 'Please complete additional verification steps.');
      } else {
        Alert.alert('Error', `Sign in incomplete. Status: ${result.status}`);
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

