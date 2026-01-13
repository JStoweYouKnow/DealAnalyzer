import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';
import type { CriteriaResponse } from '@dealanalyzer/types';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function PreferencesScreen() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: criteria, isLoading } = useQuery<CriteriaResponse>({
    queryKey: ['/api/criteria'],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/criteria`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
  });

  const updateCriteriaMutation = useMutation({
    mutationFn: async (updates: Partial<CriteriaResponse>) => {
      const token = await getToken();
      const response = await axios.put(`${API_BASE_URL}/api/criteria`, updates, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/criteria'] });
      setIsEditing(false);
      Alert.alert('Success', 'Investment criteria updated successfully');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update criteria');
    },
  });

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
      <Text style={styles.title}>Investment Preferences</Text>
      <Text style={styles.subtitle}>Configure your investment criteria</Text>

      {criteria && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Criteria</Text>
            {!isEditing ? (
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => setIsEditing(true)}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setIsEditing(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={() => {
                    // Save logic would go here
                    setIsEditing(false);
                  }}
                >
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Max Purchase Price:</Text>
            <Text style={styles.infoValue}>
              ${criteria.max_purchase_price?.toLocaleString() || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Min CoC Return:</Text>
            <Text style={styles.infoValue}>
              {(criteria.coc_minimum_min || 0) * 100}%
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Min Cap Rate:</Text>
            <Text style={styles.infoValue}>
              {(criteria.cap_minimum || 0) * 100}%
            </Text>
          </View>
        </View>
      )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007bff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: '#28a745',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});










