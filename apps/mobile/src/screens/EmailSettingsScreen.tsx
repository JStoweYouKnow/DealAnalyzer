import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import axios from 'axios';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function EmailSettingsScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [connecting, setConnecting] = useState(false);

  const { data: gmailStatus, isLoading } = useQuery({
    queryKey: ['gmail-status'],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/gmail-status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
  });

  const handleConnectGmail = async () => {
    setConnecting(true);
    try {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/gmail-auth-url`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.data.authUrl) {
        const supported = await Linking.canOpenURL(response.data.authUrl);
        if (supported) {
          await Linking.openURL(response.data.authUrl);
        } else {
          Alert.alert('Error', 'Cannot open Gmail authorization URL');
        }
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to connect Gmail');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectGmail = async () => {
    Alert.alert(
      'Disconnect Gmail',
      'Are you sure you want to disconnect your Gmail account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await getToken();
              await axios.post(
                `${API_BASE_URL}/api/gmail-disconnect`,
                {},
                {
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                }
              );
              queryClient.invalidateQueries({ queryKey: ['gmail-status'] });
              queryClient.invalidateQueries({ queryKey: ['email-deals'] });
              Alert.alert('Success', 'Gmail disconnected successfully');
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.error || 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading email settings...</Text>
      </View>
    );
  }

  const isConnected = gmailStatus?.connected || false;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Email Settings</Text>
      <Text style={styles.subtitle}>Manage Gmail integration</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gmail Connection</Text>
        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status:</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: isConnected ? '#d4edda' : '#f8d7da' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isConnected ? '#155724' : '#721c24' },
              ]}
            >
              {isConnected ? 'Connected' : 'Not Connected'}
            </Text>
          </View>
        </View>

        {isConnected ? (
          <>
            {gmailStatus?.email && (
              <Text style={styles.emailText}>Email: {gmailStatus.email}</Text>
            )}
            <TouchableOpacity
              style={styles.disconnectButton}
              onPress={handleDisconnectGmail}
            >
              <Text style={styles.disconnectButtonText}>Disconnect Gmail</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.connectButton}
            onPress={handleConnectGmail}
            disabled={connecting}
          >
            {connecting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.connectButtonText}>Connect Gmail</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Forwarding</Text>
        <Text style={styles.infoText}>
          To automatically analyze properties from emails, forward property listing emails to your
          connected Gmail account. The app will automatically detect and analyze them.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f8f8f8',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  connectButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  connectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disconnectButton: {
    backgroundColor: '#dc3545',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  disconnectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

