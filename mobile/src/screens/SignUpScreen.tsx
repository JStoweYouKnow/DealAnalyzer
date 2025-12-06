import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeTextInput } from '../components/SafeTextInput';
import { useAuth, useSignUp, useClerk } from '@clerk/clerk-expo';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SignUpScreen() {
  const { isLoaded } = useAuth();
  const clerk = useClerk();
  const { signUp, isLoaded: signUpLoaded } = useSignUp();
  
  // Get setActive from useClerk (it's not in useAuth in this version)
  const setActive = clerk?.setActive;

  // Log available methods from useAuth and useClerk
  useEffect(() => {
    if (isLoaded) {
      // Don't call useAuth() here - it's already called at the top level
      console.log('[SignUp] useClerk() returned:', clerk ? Object.keys(clerk) : 'clerk is null');
      console.log('[SignUp] setActive from useClerk:', typeof clerk?.setActive === 'function');
      console.log('[SignUp] Final setActive available:', typeof setActive === 'function');
      if (setActive) {
        console.log('[SignUp] ✅ setActive is available from useClerk()');
      } else {
        console.error('[SignUp] ❌ setActive is NOT available from useClerk()!');
        console.error('[SignUp] Clerk object:', clerk);
        console.error('[SignUp] This is a critical issue. Check Clerk configuration.');
      }
    }
  }, [isLoaded, clerk, setActive]);
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
      console.log('[SignUp] Creating account with:', {
        email: email.trim(),
        username: username.trim(),
        hasPassword: !!password,
      });

      const result = await signUp.create({
        emailAddress: email.trim(),
        username: username.trim(),
        password,
      });

      console.log('[SignUp] Account creation result:', {
        status: result.status,
        createdSessionId: result.createdSessionId,
        supportedFirstFactors: (result as any)?.supportedFirstFactors,
      });

      // Check what verification is needed
      console.log('[SignUp] Checking verification requirements...');
      console.log('[SignUp] Result status:', result.status);
      console.log('[SignUp] SignUp status:', signUp.status);
      console.log('[SignUp] Missing fields:', signUp.missingFields);
      console.log('[SignUp] Unverified fields:', signUp.unverifiedFields);
      console.log('[SignUp] Supported first factors:', (result as any)?.supportedFirstFactors);
      
      // Check if email verification is needed
      const needsEmailVerification = 
        result.status === 'missing_requirements' ||
        result.status === 'missing_fields' ||
        signUp.unverifiedFields?.includes('email_address') ||
        signUp.missingFields?.includes('email_address');

      if (needsEmailVerification || result.status !== 'complete') {
        try {
          console.log('[SignUp] Preparing email verification...');
          console.log('[SignUp] Email address:', email.trim());
          console.log('[SignUp] Strategy: email_code');
          console.log('[SignUp] Network check - testing connectivity...');
          
          // Prepare email verification with timeout
          const verifyPromise = signUp.prepareEmailAddressVerification({ 
            strategy: 'email_code' 
          });
          
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Email verification request timed out after 30 seconds. This may indicate a network or DNS issue.')), 30000);
          });
          
          let verifyResult;
          try {
            verifyResult = await Promise.race([verifyPromise, timeoutPromise]);
            console.log('[SignUp] ✅ Email verification preparation result:', verifyResult);
            console.log('[SignUp] ✅ Email verification code should be sent to:', email.trim());
            console.log('[SignUp] ✅ Network connectivity confirmed - request completed successfully');
          } catch (timeoutError: any) {
            if (timeoutError.message.includes('timed out')) {
              console.error('[SignUp] ❌ Network/DNS Issue: Request timed out');
              console.error('[SignUp] This could indicate:');
              console.error('  1. DNS resolution problem');
              console.error('  2. Network connectivity issue');
              console.error('  3. Firewall blocking Clerk servers');
              console.error('  4. Slow network connection');
              throw new Error('Network timeout: Unable to reach Clerk servers. Please check your internet connection and try again.');
            }
            throw timeoutError;
          }
          
          // Check if code was actually sent
          const emailVerification = signUp.emailAddress || (signUp as any).emailAddresses?.[0];
          console.log('[SignUp] Email verification status:', {
            email: emailVerification?.emailAddress,
            verified: emailVerification?.verification?.status,
            strategy: emailVerification?.verification?.strategy,
          });
          
          // Show verification code input
          setNeedsVerification(true);
          Alert.alert(
            'Verification Code Sent',
            `A verification code has been sent to:\n${email.trim()}\n\nPlease check your email (including spam folder) and enter the code below.`
          );
          return; // Exit early after showing verification screen
        } catch (verifyError: any) {
          console.error('[SignUp] ❌ Error preparing email verification:', verifyError);
          console.error('[SignUp] Full error object:', JSON.stringify(verifyError, null, 2));
          console.error('[SignUp] Error details:', {
            message: verifyError.message,
            errors: verifyError.errors,
            code: verifyError.code,
            status: verifyError.status,
            name: verifyError.name,
            stack: verifyError.stack,
          });
          
          let errorMsg = verifyError.errors?.[0]?.message || 
                        verifyError.message || 
                        'Failed to send verification code.';
          
          // Add more context to error message
          if (errorMsg.includes('email') && errorMsg.includes('not')) {
            errorMsg += '\n\nPlease check:\n1. Email verification is enabled in Clerk dashboard\n2. Email provider is configured\n3. Your email address is valid';
          } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
            errorMsg += '\n\nPlease check your internet connection and try again.';
          }
          
          Alert.alert(
            'Verification Code Error',
            errorMsg
          );
          return;
        }
      } else if (result.status === 'complete') {
        // Account created without verification needed
        console.log('[SignUp] ✅ Account created without email verification');
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
      }
    } catch (error: any) {
      console.error('[SignUp] ❌ Sign up error:', error);
      console.error('[SignUp] Error details:', {
        message: error.message,
        errors: error.errors,
        code: error.code,
        status: error.status,
      });
      
      let errorMessage = error.errors?.[0]?.message || 
                        error.message || 
                        'Failed to sign up. Please try again.';
      
      // Make error messages more user-friendly
      if (errorMessage.includes('email') && errorMessage.includes('already')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (errorMessage.includes('username') && errorMessage.includes('already')) {
        errorMessage = 'This username is already taken. Please choose another.';
      } else if (errorMessage.includes('email') && errorMessage.includes('invalid')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      Alert.alert('Sign Up Failed', errorMessage);
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
      console.log('[SignUp] Resending verification code to:', email);
      console.log('[SignUp] Current signUp status:', signUp.status);
      console.log('[SignUp] Email address:', signUp.emailAddress);
      
      const result = await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      console.log('[SignUp] ✅ Resend code result:', result);
      console.log('[SignUp] ✅ New verification code should be sent to:', email);
      
      Alert.alert(
        'Code Resent', 
        `A new verification code has been sent to:\n${email}\n\nPlease check your email (including spam folder).`
      );
      setVerificationCode('');
    } catch (error: any) {
      console.error('[SignUp] ❌ Resend code error:', error);
      console.error('[SignUp] Error details:', {
        message: error.message,
        errors: error.errors,
        code: error.code,
      });
      
      let errorMessage = error.errors?.[0]?.message || 
                         error.message || 
                         'Failed to resend code. Please try again.';
      
      if (errorMessage.includes('rate limit') || errorMessage.includes('too many')) {
        errorMessage = 'Too many requests. Please wait a few minutes before requesting another code.';
      }
      
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
                <SafeTextInput
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
                <SafeTextInput
                  style={styles.input}
                  placeholder="Choose a username"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoComplete="username"
                  editable={!loading}
                />

                <Text style={styles.label}>Password</Text>
                <SafeTextInput
                  style={styles.input}
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!loading}
                />

                <Text style={styles.label}>Confirm Password</Text>
                <SafeTextInput
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
                <SafeTextInput
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

