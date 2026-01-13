import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function NeighborhoodScreen() {
  const route = useRoute();
  const { getToken } = useAuth();
  const zipCode = (route.params as any)?.zipCode || '';
  const [searchZip, setSearchZip] = useState(zipCode);

  const { data: trends, isLoading } = useQuery({
    queryKey: ['neighborhood-trends', searchZip],
    queryFn: async () => {
      if (!searchZip) return null;
      const token = await getToken();
      const response = await axios.get(
        `${API_BASE_URL}/api/market/neighborhood-trends?zipCode=${searchZip}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      return Array.isArray(response.data) ? response.data[0] : response.data.data?.[0] || null;
    },
    enabled: !!searchZip,
  });

  const handleSearch = () => {
    if (!searchZip.trim()) {
      Alert.alert('Error', 'Please enter a zip code');
      return;
    }
    setSearchZip(searchZip.trim());
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || value === null) return 'N/A';
    const sign = value > 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Neighborhood Analysis</Text>
      <Text style={styles.subtitle}>Detailed neighborhood data and trends</Text>

      {/* Search */}
      <View style={styles.section}>
        <TextInput
          style={styles.input}
          placeholder="Enter zip code"
          value={searchZip}
          onChangeText={setSearchZip}
          keyboardType="numeric"
          maxLength={5}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading neighborhood data...</Text>
        </View>
      )}

      {trends && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {trends.neighborhood || trends.city || 'Neighborhood'} Trends
          </Text>

          {trends.averagePrice && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Price:</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(trends.averagePrice)}
              </Text>
            </View>
          )}

          {trends.averageRent && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Average Rent:</Text>
              <Text style={styles.metricValue}>
                {formatCurrency(trends.averageRent)}
              </Text>
            </View>
          )}

          {trends.priceChangePercent1Year !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Price Change (1Y):</Text>
              <Text style={styles.metricValue}>
                {formatPercent(trends.priceChangePercent1Year)}
              </Text>
            </View>
          )}

          {trends.rentChangePercent1Year !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Rent Change (1Y):</Text>
              <Text style={styles.metricValue}>
                {formatPercent(trends.rentChangePercent1Year)}
              </Text>
            </View>
          )}

          {trends.rentYield !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Rent Yield:</Text>
              <Text style={styles.metricValue}>
                {(trends.rentYield * 100).toFixed(2)}%
              </Text>
            </View>
          )}

          {trends.daysOnMarket !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Days on Market:</Text>
              <Text style={styles.metricValue}>{trends.daysOnMarket}</Text>
            </View>
          )}
        </View>
      )}

      {!searchZip && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Enter a zip code above to view neighborhood data
          </Text>
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
    padding: 32,
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
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});










