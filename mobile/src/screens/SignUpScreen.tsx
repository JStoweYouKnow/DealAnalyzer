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
import { useAuth, useSignUp } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const auth = useAuth();
  const { setActive, isLoaded } = auth || {};
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  
  // Log available methods from useAuth
  useEffect(() => {
    if (isLoaded) {
      console.log('useAuth() returned:', Object.keys(auth || {}));
      console.log('setActive available:', typeof setActive === 'function');
    }
  }, [isLoaded, auth, setActive]);
  const navigation = useNavigation<NavigationProp>();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [verifying, setVerifying] = useState(false);

  const handleSignUp = async () => {
    if (!isLoaded || !signUpLoaded) {
      Alert.alert('Error', 'Authentication is not ready. Please wait a moment and try again.');
      return;
    }

    if (!signUp) {
      Alert.alert('Error', 'Sign up service is not available. Please restart the app.');
      return;
    }

    if (!email || !username || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const result = await signUp.create({
        emailAddress: email.trim(),
        username: username.trim(),
        password,
      });

      // Send email verification code
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      if (result.status === 'complete') {
        if (setActive && typeof setActive === 'function') {
          await setActive({ session: result.createdSessionId });
        } else {
          console.warn('setActive not available, but account should be created');
          Alert.alert(
            'Account Created',
            'Your account has been created. Please sign in now.'
          );
          navigation.navigate('SignIn');
        }
      } else {
        // Show verification code input
        setNeedsVerification(true);
        Alert.alert(
          'Verification Code Sent',
          'Please check your email and enter the verification code below.'
        );
      }
    } catch (error: any) {
      Alert.alert('Error', error.errors?.[0]?.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!verificationCode || verificationCode.trim() === '') {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    if (!signUp) {
      Alert.alert('Error', 'Sign up service is not available');
      return;
    }

    if (!isLoaded) {
      Alert.alert('Error', 'Authentication is not ready. Please wait a moment.');
      return;
    }

    setVerifying(true);
    try {
      console.log('Attempting to verify code:', verificationCode.trim());
      console.log('SignUp status before verification:', signUp.status);
      
      const result = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      console.log('Verification result:', result);
      console.log('SignUp status after verification:', signUp.status);
      console.log('Verification result createdSessionId:', result.createdSessionId);
      console.log('SignUp createdSessionId:', signUp.createdSessionId);
      console.log('SignUp object methods:', signUp ? Object.keys(signUp) : 'signUp is null');

      // Priority 1: Check if we have a session ID from the verification result
      if (result.createdSessionId) {
        console.log('Session ID found in verification result, activating...');
        if (setActive && typeof setActive === 'function') {
          await setActive({ session: result.createdSessionId });
          console.log('Session activated successfully from verification result');
          // Navigation will automatically switch to MainTabs
          return; // Exit early if we successfully activated
        } else {
          console.warn('setActive is not available, but session ID exists. Account should be created.');
          Alert.alert(
            'Email Verified',
            'Your email has been verified and account created. Please sign in now.'
          );
          navigation.navigate('SignIn');
          return;
        }
      }

      // Priority 2: Check if signUp object has a session ID
      if (signUp && signUp.createdSessionId) {
        console.log('Using session ID from signUp object:', signUp.createdSessionId);
        if (setActive && typeof setActive === 'function') {
          await setActive({ session: signUp.createdSessionId });
          console.log('Session activated successfully');
          return; // Exit early on success
        } else {
          console.warn('setActive is not available, but session ID exists.');
          Alert.alert(
            'Email Verified',
            'Your email has been verified and account created. Please sign in now.'
          );
          navigation.navigate('SignIn');
          return;
        }
      }

      // Priority 3: Check if status is complete and try to get session
      const isComplete = result.status === 'complete' || signUp.status === 'complete';
      
      if (isComplete) {
        console.log('Verification complete, checking for session...');
        
        // In newer Clerk versions, the session might be available directly
        // Try to activate with whatever session info we have
        if (result.createdSessionId && setActive && typeof setActive === 'function') {
          await setActive({ session: result.createdSessionId });
          return;
        }
        
        // If no session ID available but status is complete, account should exist
        // Redirect to sign in
        console.log('Status is complete but no session ID - account should be created');
        Alert.alert(
          'Email Verified',
          'Your email has been verified and account created. Please sign in now.'
        );
        navigation.navigate('SignIn');
        return;
      } else if (result.status === 'missing_requirements' || signUp.status === 'missing_requirements') {
        // Handle missing requirements
        console.log('Missing requirements detected');
        console.log('Missing fields:', signUp.missingFields);
        console.log('Unverified fields:', signUp.unverifiedFields);
        
        // Check if username is missing and we have it
        const missingFields = signUp.missingFields || [];
        if (missingFields.includes('username') && username.trim()) {
          console.log('Updating signUp with username:', username.trim());
          try {
            await signUp.update({ username: username.trim() });
            console.log('Username updated, status after update:', signUp.status);
            
            // After updating, check if we can proceed
            if (signUp.status === 'complete' && signUp.createdSessionId) {
              if (setActive && typeof setActive === 'function') {
                await setActive({ session: signUp.createdSessionId });
                console.log('Session activated after username update');
                return;
              } else {
                console.warn('setActive not available, redirecting to sign in');
                Alert.alert(
                  'Account Created',
                  'Your account has been created. Please sign in now.'
                );
                navigation.navigate('SignIn');
                return;
              }
            }
          } catch (updateError: any) {
            console.error('Error updating username:', updateError);
          }
        }
        
        // If we still have missing requirements, show error
        if (missingFields.length > 0) {
          const missingFieldNames = missingFields.join(', ');
          Alert.alert(
            'Missing Information',
            `Please provide: ${missingFieldNames}. Your email is verified, but the account cannot be created without this information.`
          );
          // Go back to form to collect missing info
          setNeedsVerification(false);
          return;
        }
        
        // If no missing fields but still missing_requirements, try to proceed
        console.warn('No session ID available, but email is verified');
        Alert.alert(
          'Email Verified',
          'Your email has been verified. Please sign in to complete your account setup.'
        );
        navigation.navigate('SignIn');
      } else {
        console.warn('Verification incomplete:', {
          resultStatus: result.status,
          signUpStatus: signUp.status,
        });
        Alert.alert(
          'Verification Incomplete', 
          `Status: ${result.status || signUp.status}. Please check your code and try again.`
        );
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      console.error('Error details:', {
        message: error.message,
        errors: error.errors,
        status: error.status,
      });
      
      let errorMessage = error.errors?.[0]?.message || 
                         error.message || 
                         'Invalid verification code. Please try again.';
      
      // Handle "already signed in" error - this means account was created!
      if (errorMessage.includes('already signed in') || errorMessage.includes('session_exists')) {
        Alert.alert(
          'Account Created',
          'Your account has been created and you are signed in! Redirecting to the app...'
        );
        // Navigation will automatically switch based on isSignedIn status
        return;
      }
      
      // Make error messages more user-friendly
      if (errorMessage.includes('expired') || errorMessage.includes('invalid')) {
        errorMessage = 'The verification code is invalid or has expired. Please request a new code.';
      }
      
      Alert.alert('Verification Failed', errorMessage);
    } finally {
      setVerifying(false);
    }
  };

  const handleResendCode = async () => {
    if (!signUp) {
      Alert.alert('Error', 'Sign up service is not available');
      return;
    }

    try {
      console.log('Resending verification code to:', email);
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      Alert.alert('Code Resent', 'A new verification code has been sent to your email.');
      setVerificationCode('');
    } catch (error: any) {
      console.error('Resend code error:', error);
      const errorMessage = error.errors?.[0]?.message || 
                           error.message || 
                           'Failed to resend code. Please try again.';
      Alert.alert('Error', errorMessage);
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
          {!needsVerification ? (
            <>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Sign up to get started</Text>

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
                  editable={!loading}
                />

                <Text style={styles.label}>Username</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!loading}
                />

                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <Text style={styles.label}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSignUp}
                  disabled={loading}
                >
                  <Text style={styles.buttonText}>
                    {loading ? 'Creating account...' : 'Sign Up'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={() => navigation.navigate('SignIn')}
                >
                  <Text style={styles.linkText}>
                    Already have an account? Sign in
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>Verify Your Email</Text>
              <Text style={styles.subtitle}>
                We sent a verification code to{'\n'}
                <Text style={styles.emailText}>{email}</Text>
              </Text>

              <View style={styles.form}>
                <Text style={styles.label}>Verification Code</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChangeText={setVerificationCode}
                  keyboardType="number-pad"
                  autoCapitalize="none"
                  maxLength={6}
                  editable={!verifying}
                />

                <TouchableOpacity
                  style={[styles.button, verifying && styles.buttonDisabled]}
                  onPress={handleVerifyCode}
                  disabled={verifying || !verificationCode}
                >
                  <Text style={styles.buttonText}>
                    {verifying ? 'Verifying...' : 'Verify Code'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.linkButton}
                  onPress={handleResendCode}
                  disabled={verifying}
                >
                  <Text style={styles.linkText}>
                    Didn't receive a code? Resend
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.linkButton, { marginTop: 8 }]}
                  onPress={() => {
                    setNeedsVerification(false);
                    setVerificationCode('');
                  }}
                >
                  <Text style={[styles.linkText, { color: '#8E8E93' }]}>
                    Change email address
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
  emailText: {
    fontWeight: '600',
    color: '#000000',
  },
});

