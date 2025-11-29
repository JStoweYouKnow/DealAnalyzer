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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '../services/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from '@react-navigation/native';

export default function EmailSettingsScreen() {
  const { user } = useAuth();
  const authenticatedClient = useApiClient();
  const queryClient = useQueryClient();
  const [isConnecting, setIsConnecting] = useState(false);
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
      try {
        const response = await authenticatedClient.get('/gmail-status');
        console.log('[Gmail Status] API response:', response.data);
        return response.data;
      } catch (error: any) {
        console.error('Error checking Gmail status:', error);
        return { success: false, connected: false };
      }
    },
    refetchInterval: isConnecting ? 2000 : false,
    enabled: !!user, // Only check status if user is logged in
    staleTime: 0, // Always consider data stale to allow refetching
    gcTime: 0, // Don't cache to ensure fresh data (React Query v5 uses gcTime instead of cacheTime)
    refetchOnMount: true, // Always refetch when component mounts
    refetchOnWindowFocus: true, // Refetch when window regains focus
  });

  const isConnected = gmailStatus?.connected === true;
  
  // Log status changes for debugging
  React.useEffect(() => {
    console.log('[Gmail Status] Status changed:', {
      connected: isConnected,
      isLoading: isLoadingStatus,
      data: gmailStatus,
    });
  }, [isConnected, isLoadingStatus, gmailStatus]);

  // Refetch status when screen comes into focus (e.g., after OAuth redirect)
  useFocusEffect(
    React.useCallback(() => {
      if (user && !isConnecting) {
        // Small delay to ensure OAuth callback has processed
        const timer = setTimeout(() => {
          console.log('[Gmail Status] Screen focused, refetching status...');
          queryClient.removeQueries({ queryKey: ['gmail-status'] });
          refetchStatus();
        }, 500);
        return () => clearTimeout(timer);
      }
    }, [user, isConnecting, queryClient, refetchStatus])
  );

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

      // Open the OAuth URL in the browser
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'dealanalyzer://gmail-callback'
      );

      // Check if user completed the auth flow
      if (result.type === 'success' || result.type === 'dismiss') {
        // Wait a moment for the server to process the callback
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Force a complete refetch by removing from cache and refetching
        queryClient.removeQueries({ queryKey: ['gmail-status'] });
        const { data: statusData } = await refetchStatus();
        
        console.log('[Gmail Connect] Initial status check:', statusData);
        
        if (statusData?.connected) {
          Alert.alert('Success', 'Gmail account connected successfully!');
          // Force UI update by removing and refetching
          queryClient.removeQueries({ queryKey: ['gmail-status'] });
          await refetchStatus();
        } else {
          // Poll a few more times in case the server is still processing
          let attempts = 0;
          const maxAttempts = 5;
          let connected = false;
          
          while (attempts < maxAttempts && !connected) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Remove from cache and force fresh fetch
            queryClient.removeQueries({ queryKey: ['gmail-status'] });
            const { data: pollData } = await refetchStatus();
            console.log('[Gmail Connect] Poll attempt', attempts + 1, ':', pollData);
            connected = pollData?.connected === true;
            attempts++;
          }
          
          if (connected) {
            Alert.alert('Success', 'Gmail account connected successfully!');
            // Final removal and refetch to ensure UI updates
            queryClient.removeQueries({ queryKey: ['gmail-status'] });
            await refetchStatus();
          } else {
            Alert.alert(
              'Connection Status',
              'Please check if the authorization completed. You can verify the connection status below.'
            );
          }
        }
      } else if (result.type === 'cancel') {
        Alert.alert('Cancelled', 'Gmail connection was cancelled.');
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

