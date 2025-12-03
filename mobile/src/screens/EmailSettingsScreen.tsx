import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Switch,
  ActivityIndicator,
  AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function EmailSettingsScreen() {
  const { user } = useAuth();
  const authenticatedClient = useApiClient();
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const [isConnecting, setIsConnecting] = useState(false);
  
  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      
      // Show tab bar again when screen is unfocused
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: undefined,
          });
        }
      };
    }, [navigation])
  );
  const [emailSettings, setEmailSettings] = useState({
    forwardingEmail: user?.emailAddresses[0]?.emailAddress || '',
    autoForward: false,
    filterKeywords: 'property,deal,investment,real estate',
    emailFrequency: 'immediate',
  });

  // Check Gmail connection status
  const { data: gmailStatus, isLoading: isLoadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: async () => {
      // Default return value to ensure we never return undefined
      const defaultResult = { success: false, connected: false };
      
      try {
        console.log('[Gmail Status] Fetching status...');
        console.log('[Gmail Status] User available:', !!user);
        console.log('[Gmail Status] Authenticated client:', !!authenticatedClient);
        
        const response = await authenticatedClient.get('/gmail-status');
        
        // If response is falsy, return default
        if (!response) {
          console.warn('[Gmail Status] No response received, returning default');
          return defaultResult;
        }
        
        // Log the raw response for debugging
        console.log('[Gmail Status] Raw response:', {
          response: response,
          responseType: typeof response,
          isAxiosResponse: response?.status !== undefined,
          status: response?.status,
          statusText: response?.statusText,
          headers: response?.headers,
        });
        
        // Handle different response structures
        // Axios wraps the response in response.data, but sometimes the data might be the response itself
        let responseData = response;
        if (response && typeof response === 'object' && 'data' in response) {
          responseData = response.data;
        } else if (response && typeof response === 'object' && 'status' in response) {
          // This is an axios response object, get the data
          responseData = (response as any).data;
        }
        
        console.log('[Gmail Status] Extracted response data:', {
          responseData,
          responseDataType: typeof responseData,
          responseDataKeys: responseData ? Object.keys(responseData) : [],
          isArray: Array.isArray(responseData),
        });
        
        // Ensure we return a valid object
        if (!responseData || typeof responseData !== 'object') {
          console.warn('[Gmail Status] Invalid response format, returning default. ResponseData:', responseData);
          return defaultResult;
        }
        
        // Validate the response has expected structure
        const result = {
          success: responseData.success !== undefined ? responseData.success : true,
          connected: responseData.connected === true,
          error: responseData.error,
        };
        
        console.log('[Gmail Status] Parsed result:', result);
        
        // Final safety check - ensure we never return undefined
        return result || defaultResult;
      } catch (error: any) {
        console.error('[Gmail Status] Error checking Gmail status:', error);
        // Log detailed error information
        if (error.response) {
          console.error('[Gmail Status] Error response details:', {
            status: error.response.status,
            statusText: error.response.statusText,
            data: error.response.data,
            headers: error.response.headers,
          });
        } else if (error.request) {
          console.error('[Gmail Status] No response received:', {
            message: error.message,
            code: error.code,
          });
        } else {
          console.error('[Gmail Status] Request setup error:', error.message);
        }
        // Return default disconnected state on error
        const errorResult = { 
          success: false, 
          connected: false, 
          error: error.response?.data?.error || error.message 
        };
        console.log('[Gmail Status] Returning error result:', errorResult);
        return errorResult;
      }
    },
    refetchInterval: isConnecting ? 2000 : false,
    enabled: !!user, // Only check status if user is logged in
    staleTime: 0, // Always consider data stale to allow refetching
    gcTime: 0, // Don't cache to ensure fresh data (React Query v5 uses gcTime instead of cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
    retry: 1, // Retry once on failure
    retryDelay: 1000, // Wait 1 second before retry
    // Provide a default value to prevent undefined
    placeholderData: { success: false, connected: false },
  });

  // Safely extract connection status with fallback
  // Use nullish coalescing to ensure we always have a boolean
  const isConnected = (gmailStatus?.connected === true) ?? false;
  
  // Log status changes for debugging
  React.useEffect(() => {
    console.log('[Gmail Status] Status changed:', {
      connected: isConnected,
      isLoading: isLoadingStatus,
      hasData: !!gmailStatus,
      data: gmailStatus,
      dataType: typeof gmailStatus,
      dataKeys: gmailStatus ? Object.keys(gmailStatus) : [],
    });
    
    // Warn if data is undefined but not loading
    if (!isLoadingStatus && !gmailStatus) {
      console.warn('[Gmail Status] ⚠️ Status data is undefined after loading completed');
    }
  }, [isConnected, isLoadingStatus, gmailStatus]);

  // Refetch status when screen comes into focus (e.g., after OAuth redirect)
  useFocusEffect(
    React.useCallback(() => {
      if (user && !isConnecting) {
        console.log('[Gmail Status] Screen focused, will refetch status...');
        // Small delay to ensure OAuth callback has processed
        const timer = setTimeout(() => {
          console.log('[Gmail Status] Refetching status after focus...');
          // Clear cache and force refetch
          queryClient.removeQueries({ queryKey: ['gmail-status'] });
          refetchStatus();
        }, 1000); // Increased delay to ensure callback has processed
        
        // Also refetch immediately in case the delay isn't needed
        refetchStatus();
        
        return () => clearTimeout(timer);
      }
    }, [user, isConnecting, queryClient, refetchStatus])
  );
  
  // Also listen for app state changes to refetch when app comes to foreground
  useEffect(() => {
    const handleAppStateChange = (nextAppState: string) => {
      if (nextAppState === 'active' && user && !isConnecting) {
        console.log('[Gmail Status] App became active, refetching status...');
        // Refetch status when app comes to foreground (e.g., after OAuth)
        setTimeout(() => {
          queryClient.removeQueries({ queryKey: ['gmail-status'] });
          refetchStatus();
        }, 500);
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
    };
  }, [user, isConnecting, queryClient, refetchStatus]);

  const handleConnectGmail = async () => {
    if (isConnecting) return;

    try {
      setIsConnecting(true);

      // Get the OAuth URL from the API
      const response = await authenticatedClient.get('/gmail-auth-url');
      const { authUrl } = response.data;

      if (!authUrl) {
        throw new Error('Failed to get Gmail authorization URL');
      }

      // Parse and log the redirect URI from the auth URL
      let redirectUriFromAuth = 'unknown';
      try {
        const urlObj = new URL(authUrl);
        redirectUriFromAuth = urlObj.searchParams.get('redirect_uri') || 'not found in URL';
      } catch (e) {
        console.warn('[Gmail Connect] Could not parse auth URL:', e);
      }
      
      console.log('[Gmail Connect] Opening OAuth URL...', { 
        authUrlLength: authUrl.length,
        authUrlPreview: authUrl.substring(0, 100) + '...',
        redirectUri: redirectUriFromAuth,
        fullAuthUrl: authUrl, // Log full URL for debugging
      });
      
      // Use WebBrowser.openAuthSessionAsync for proper OAuth flow
      // This creates an in-app browser that properly handles OAuth redirects
      try {
        console.log('[Gmail Connect] Opening OAuth session with WebBrowser.openAuthSessionAsync...');

        const result = await WebBrowser.openAuthSessionAsync(authUrl, 'dealanalyzer://gmail-callback');

        console.log('[Gmail Connect] WebBrowser result:', result);

        if (result.type === 'success') {
          console.log('[Gmail Connect] ✅ OAuth completed successfully');
          console.log('[Gmail Connect] Redirect URL:', result.url);

          // The redirect URL should be dealanalyzer://gmail-callback?success=true
          // This will automatically trigger our deep link handler in App.tsx

          // Force a status check after successful OAuth
          setTimeout(() => {
            console.log('[Gmail Connect] Forcing status check after successful OAuth...');
            queryClient.removeQueries({ queryKey: ['gmail-status'] });
            refetchStatus();
          }, 1000);

          Alert.alert(
            'Gmail Connected!',
            'Your Gmail account has been successfully connected. Deal notifications will be sent to your email.',
            [{ text: 'OK' }]
          );
        } else if (result.type === 'cancel') {
          console.log('[Gmail Connect] User cancelled OAuth');
          Alert.alert(
            'Authorization Cancelled',
            'Gmail authorization was cancelled. You can try again when ready.',
            [{ text: 'OK' }]
          );
        } else if (result.type === 'dismiss') {
          console.log('[Gmail Connect] Browser dismissed');
          Alert.alert(
            'Authorization Incomplete',
            'The authorization browser was closed. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } catch (webBrowserError: any) {
        console.error('[Gmail Connect] Error with WebBrowser:', webBrowserError);
        Alert.alert(
          'Error',
          'Failed to open browser for authorization. Please check your internet connection and try again.',
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (error: any) {
      console.error('Error connecting Gmail:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to connect Gmail account. Please try again.'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnectGmail = () => {
    Alert.alert(
      'Disconnect Gmail',
      'Are you sure you want to disconnect your Gmail account? You will need to reconnect to continue syncing emails.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: Implement disconnect endpoint
              Alert.alert('Info', 'Disconnect functionality coming soon!');
              await refetchStatus();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to disconnect Gmail account.');
            }
          },
        },
      ]
    );
  };

  const handleSave = () => {
    // TODO: Save email settings to backend
    Alert.alert('Success', 'Email settings saved successfully!');
  };

  const handleTestEmail = () => {
    Alert.alert('Test Email', 'A test email will be sent to your forwarding address.');
    // TODO: Send test email
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Gmail Integration</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={24} color="#007AFF" />
              <Text style={styles.infoText}>
                Connect your Gmail account to automatically receive and analyze property deals from your emails.
              </Text>
            </View>

            {isLoadingStatus ? (
              <View style={styles.statusRow}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.statusText}>Checking connection status...</Text>
              </View>
            ) : isConnected ? (
              <>
                <View style={styles.statusRow}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                  <Text style={styles.statusText}>Gmail account connected</Text>
                </View>
                <TouchableOpacity
                  style={styles.disconnectButton}
                  onPress={handleDisconnectGmail}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={18} color="#FF3B30" />
                  <Text style={styles.disconnectButtonText}>Disconnect Gmail</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={[styles.connectButton, isConnecting && styles.connectButtonDisabled]}
                onPress={handleConnectGmail}
                disabled={isConnecting}
                activeOpacity={0.7}
              >
                {isConnecting ? (
                  <>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>Connecting...</Text>
                  </>
                ) : (
                  <>
                    <Ionicons name="mail" size={20} color="#FFFFFF" />
                    <Text style={styles.connectButtonText}>Connect Gmail Account</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Email Forwarding</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.inputContainer}>
              <Input
                label="Forwarding Email Address"
                value={emailSettings.forwardingEmail}
                onChangeText={(text) => setEmailSettings({ ...emailSettings, forwardingEmail: text })}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholder="your-email@example.com"
              />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Auto-Forward Deals</Text>
                <Text style={styles.settingDescription}>
                  Automatically forward property deals to this email
                </Text>
              </View>
              <Switch
                value={emailSettings.autoForward}
                onValueChange={(value) => setEmailSettings({ ...emailSettings, autoForward: value })}
                trackColor={{ false: '#E5E5EA', true: '#007AFF' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <TouchableOpacity
              style={styles.testButton}
              onPress={handleTestEmail}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={18} color="#007AFF" />
              <Text style={styles.testButtonText}>Send Test Email</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Email Filters</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.inputContainer}>
              <Input
                label="Filter Keywords"
                value={emailSettings.filterKeywords}
                onChangeText={(text) => setEmailSettings({ ...emailSettings, filterKeywords: text })}
                placeholder="property, deal, investment"
                multiline
                style={styles.multilineInput}
              />
              <Text style={styles.helperText}>
                Comma-separated keywords to identify property deal emails
              </Text>
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingLabel}>Email Frequency</Text>
                <Text style={styles.settingDescription}>How often to check for new emails</Text>
              </View>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => {
                  Alert.alert('Email Frequency', 'Select frequency', [
                    { text: 'Immediate', onPress: () => setEmailSettings({ ...emailSettings, emailFrequency: 'immediate' }) },
                    { text: 'Hourly', onPress: () => setEmailSettings({ ...emailSettings, emailFrequency: 'hourly' }) },
                    { text: 'Daily', onPress: () => setEmailSettings({ ...emailSettings, emailFrequency: 'daily' }) },
                    { text: 'Cancel', style: 'cancel' },
                  ]);
                }}
              >
                <Text style={styles.pickerText}>
                  {emailSettings.emailFrequency.charAt(0).toUpperCase() + emailSettings.emailFrequency.slice(1)}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
              </TouchableOpacity>
            </View>
          </CardContent>
        </Card>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSave}
          activeOpacity={0.7}
        >
          <Text style={styles.saveButtonText}>Save Email Settings</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E5F2FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 8,
    lineHeight: 20,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  connectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disconnectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    gap: 8,
  },
  disconnectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  inputContainer: {
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    marginTop: 8,
    gap: 8,
  },
  testButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  pickerText: {
    fontSize: 16,
    color: '#000000',
    marginRight: 8,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

