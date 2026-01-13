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
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

interface Demographics {
  population?: number;
  medianIncome?: number;
  medianAge?: number;
  medianHomeValue?: number;
  perCapitaIncome?: number;
  medianGrossRent?: number;
  totalHousingUnits?: number;
  ownerOccupied?: number;
  renterOccupied?: number;
  unemploymentRate?: number;
  educationLevel?: string;
}

interface MarketTrend {
  zipCode?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  averagePrice?: number;
  averageRent?: number;
  priceChangePercent3Month?: number;
  priceChangePercent6Month?: number;
  priceChangePercent1Year?: number;
  rentChangePercent3Month?: number;
  rentChangePercent6Month?: number;
  rentChangePercent1Year?: number;
  daysOnMarket?: number;
  pricePerSqft?: number;
  rentYield?: number;
  demographics?: Demographics;
}

export default function MarketScreen() {
  const { getToken } = useAuth();
  const [zipCode, setZipCode] = useState('');
  const [selectedZip, setSelectedZip] = useState<string | null>(null);

  const { data: trends, isLoading, error } = useQuery<MarketTrend[]>({
    queryKey: ['market-trends', selectedZip],
    queryFn: async () => {
      if (!selectedZip) return [];
      const token = await getToken();
      try {
        // Request live data by adding live=true parameter
        const response = await axios.get(
          `${API_BASE_URL}/api/market/neighborhood-trends?zipCode=${selectedZip}&live=true`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          }
        );
        console.log('[MarketScreen] API Response:', response.data);
        const data = Array.isArray(response.data) ? response.data : response.data?.data || [];
        console.log('[MarketScreen] Parsed trends:', data);
        if (data.length === 0) {
          console.warn('[MarketScreen] No trends returned from API');
        }
        return data;
      } catch (error: any) {
        console.error('[MarketScreen] API Error:', error.response?.data || error.message);
        throw error;
      }
    },
    enabled: !!selectedZip,
  });

  const handleSearch = () => {
    if (!zipCode.trim()) {
      Alert.alert('Error', 'Please enter a zip code');
      return;
    }
    setSelectedZip(zipCode.trim());
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

  const getChangeColor = (value?: number) => {
    if (value === undefined || value === null) return '#666';
    if (value > 0) return '#28a745';
    if (value < 0) return '#dc3545';
    return '#666';
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Market Intelligence</Text>
      <Text style={styles.subtitle}>Explore market trends and data</Text>

      {/* Search Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Search by Zip Code</Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="Enter zip code"
            value={zipCode}
            onChangeText={setZipCode}
            keyboardType="numeric"
            maxLength={5}
          />
          <TouchableOpacity
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Results */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>Loading market data...</Text>
        </View>
      )}

      {error && (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyText, { color: '#dc3545' }]}>
            Error loading market data: {error instanceof Error ? error.message : 'Unknown error'}
          </Text>
        </View>
      )}

      {!isLoading && !error && selectedZip && trends && trends.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No market data found for this zip code</Text>
        </View>
      )}

      {trends && trends.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Market Trends for {selectedZip}
          </Text>
          {trends.map((trend, index) => (
            <View key={index} style={styles.trendCard}>
              <Text style={styles.trendTitle}>
                {trend.neighborhood || trend.city || 'Area'}
              </Text>
              
              {trend.averagePrice && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Average Price:</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(trend.averagePrice)}
                  </Text>
                </View>
              )}

              {trend.averageRent && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Average Rent:</Text>
                  <Text style={styles.metricValue}>
                    {formatCurrency(trend.averageRent)}
                  </Text>
                </View>
              )}

              {trend.priceChangePercent1Year !== undefined && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Price Change (1Y):</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getChangeColor(trend.priceChangePercent1Year) },
                    ]}
                  >
                    {formatPercent(trend.priceChangePercent1Year)}
                  </Text>
                </View>
              )}

              {trend.rentChangePercent1Year !== undefined && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Rent Change (1Y):</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: getChangeColor(trend.rentChangePercent1Year) },
                    ]}
                  >
                    {formatPercent(trend.rentChangePercent1Year)}
                  </Text>
                </View>
              )}

              {trend.rentYield !== undefined && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Rent Yield:</Text>
                  <Text style={styles.metricValue}>
                    {(trend.rentYield * 100).toFixed(2)}%
                  </Text>
                </View>
              )}

              {trend.daysOnMarket !== undefined && (
                <View style={styles.metricRow}>
                  <Text style={styles.metricLabel}>Days on Market:</Text>
                  <Text style={styles.metricValue}>{trend.daysOnMarket}</Text>
                </View>
              )}

              {/* Display demographics data if market metrics are not available */}
              {(!trend.averagePrice && !trend.averageRent) && trend.demographics && (
                <>
                  {trend.demographics.medianHomeValue && (
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Median Home Value:</Text>
                      <Text style={styles.metricValue}>
                        {formatCurrency(trend.demographics.medianHomeValue)}
                      </Text>
                    </View>
                  )}

                  {trend.demographics.medianGrossRent && (
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Median Rent:</Text>
                      <Text style={styles.metricValue}>
                        {formatCurrency(trend.demographics.medianGrossRent)}
                      </Text>
                    </View>
                  )}

                  {trend.demographics.medianIncome && (
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Median Income:</Text>
                      <Text style={styles.metricValue}>
                        {formatCurrency(trend.demographics.medianIncome)}
                      </Text>
                    </View>
                  )}

                  {trend.demographics.population && (
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Population:</Text>
                      <Text style={styles.metricValue}>
                        {trend.demographics.population.toLocaleString()}
                      </Text>
                    </View>
                  )}

                  {trend.demographics.totalHousingUnits && (
                    <View style={styles.metricRow}>
                      <Text style={styles.metricLabel}>Housing Units:</Text>
                      <Text style={styles.metricValue}>
                        {trend.demographics.totalHousingUnits.toLocaleString()}
                      </Text>
                    </View>
                  )}
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {!selectedZip && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Enter a zip code above to view market trends
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
    marginBottom: 12,
    color: '#333',
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 4,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  centered: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
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
  trendCard: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  trendTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
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
});










