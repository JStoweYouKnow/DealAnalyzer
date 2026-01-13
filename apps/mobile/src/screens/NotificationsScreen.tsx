import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function NotificationsScreen() {
  const { getToken, user } = useAuth();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState({
    notifyOnNewDeals: false,
    notifyOnAnalysisComplete: false,
    notifyOnCriteriaMatch: true,
    notifyOnWeeklySummary: false,
    frequency: 'immediate' as 'immediate' | 'daily' | 'weekly',
  });

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['/api/user/notifications'],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/user/notifications`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    enabled: !!user,
  });

  React.useEffect(() => {
    if (prefs) {
      setNotifications({
        notifyOnNewDeals: prefs.notifyOnNewDeals ?? false,
        notifyOnAnalysisComplete: prefs.notifyOnAnalysisComplete ?? false,
        notifyOnCriteriaMatch: prefs.notifyOnCriteriaMatch ?? true,
        notifyOnWeeklySummary: prefs.notifyOnWeeklySummary ?? false,
        frequency: prefs.frequency || 'immediate',
      });
    }
  }, [prefs]);

  const updateMutation = useMutation({
    mutationFn: async (updates: typeof notifications) => {
      const token = await getToken();
      const email = user?.primaryEmailAddress?.emailAddress || '';
      const response = await axios.put(
        `${API_BASE_URL}/api/user/notifications`,
        { ...updates, email },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/notifications'] });
      Alert.alert('Success', 'Notification preferences saved');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to save preferences');
    },
  });

  const handleSave = () => {
    updateMutation.mutate(notifications);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading preferences...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Preferences</Text>
      <Text style={styles.subtitle}>Manage your email notifications</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Notifications</Text>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>New Deals</Text>
          <Switch
            value={notifications.notifyOnNewDeals}
            onValueChange={(value) =>
              setNotifications({ ...notifications, notifyOnNewDeals: value })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Analysis Complete</Text>
          <Switch
            value={notifications.notifyOnAnalysisComplete}
            onValueChange={(value) =>
              setNotifications({
                ...notifications,
                notifyOnAnalysisComplete: value,
              })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Criteria Match</Text>
          <Switch
            value={notifications.notifyOnCriteriaMatch}
            onValueChange={(value) =>
              setNotifications({
                ...notifications,
                notifyOnCriteriaMatch: value,
              })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={styles.switchLabel}>Weekly Summary</Text>
          <Switch
            value={notifications.notifyOnWeeklySummary}
            onValueChange={(value) =>
              setNotifications({
                ...notifications,
                notifyOnWeeklySummary: value,
              })
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequency</Text>
        {(['immediate', 'daily', 'weekly'] as const).map((freq) => (
          <TouchableOpacity
            key={freq}
            style={[
              styles.frequencyOption,
              notifications.frequency === freq && styles.frequencyOptionActive,
            ]}
            onPress={() =>
              setNotifications({ ...notifications, frequency: freq })
            }
          >
            <Text
              style={[
                styles.frequencyText,
                notifications.frequency === freq &&
                  styles.frequencyTextActive,
              ]}
            >
              {freq.charAt(0).toUpperCase() + freq.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={updateMutation.isPending}
      >
        {updateMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        )}
      </TouchableOpacity>
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
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  switchLabel: {
    fontSize: 14,
    color: '#333',
  },
  frequencyOption: {
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  frequencyOptionActive: {
    backgroundColor: '#007bff',
    borderColor: '#007bff',
  },
  frequencyText: {
    fontSize: 14,
    color: '#333',
  },
  frequencyTextActive: {
    color: '#fff',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});










