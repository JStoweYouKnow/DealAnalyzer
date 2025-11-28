import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { apiClient } from '../services/api';

interface NeighborhoodTrend {
  zipCode?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  averagePrice?: number;
  averageRent?: number;
  priceChangePercent1Year?: number;
  priceChangePercent6Month?: number;
  priceChangePercent3Month?: number;
  rentChangePercent1Year?: number;
  rentChangePercent6Month?: number;
  rentChangePercent3Month?: number;
  rentYield?: number;
  marketStats?: {
    totalProperties?: number;
    medianSalePrice?: number;
    avgPricePerSqft?: number;
    medianBuildingSize?: number;
    avgYearBuilt?: number;
    propertyTypes?: Record<string, number>;
    ownerOccupancyRate?: number;
  };
  demographics?: {
    population?: number;
    medianIncome?: number;
    medianAge?: number;
    medianHomeValue?: number;
    medianGrossRent?: number;
    unemploymentRate?: number;
  };
  lastUpdated?: string;
}

export default function NeighborhoodScreen() {
  const [zipCode, setZipCode] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [searchZip, setSearchZip] = useState<string | null>(null);

  const { data: trends = [], isLoading, refetch, error } = useQuery<NeighborhoodTrend[]>({
    queryKey: ['neighborhood-trends', searchZip],
    queryFn: async () => {
      if (!searchZip) return [];
      
      try {
        console.log('🔍 Fetching neighborhood data for ZIP:', searchZip);
        const params = new URLSearchParams();
        params.append('zipCode', searchZip);
        params.append('live', 'true');
        
        const response = await apiClient.get(`/market/neighborhood-trends?${params.toString()}`);
        const data = response.data || response;
        const trendsData = data.data || data || [];
        console.log('✅ Neighborhood data fetched:', trendsData.length, 'trends');
        return Array.isArray(trendsData) ? trendsData : [];
      } catch (err: any) {
        console.error('❌ Failed to fetch neighborhood trends:', err);
        return [];
      }
    },
    enabled: !!searchZip,
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleSearch = () => {
    const cleaned = zipCode.trim().replace(/\D/g, '').slice(0, 5);
    if (cleaned.length === 5) {
      setSearchZip(cleaned);
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value || !Number.isFinite(value)) return 'N/A';
    return `$${value.toLocaleString()}`;
  };

  const formatPercent = (value?: number) => {
    if (value === undefined || !Number.isFinite(value)) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const formatNumber = (value?: number) => {
    if (!value || !Number.isFinite(value)) return 'N/A';
    return value.toLocaleString();
  };

  const getTrendIcon = (value?: number) => {
    if (value === undefined || !Number.isFinite(value)) return 'remove-outline';
    return value >= 0 ? 'trending-up' : 'trending-down';
  };

  const getTrendColor = (value?: number) => {
    if (value === undefined || !Number.isFinite(value)) return '#8E8E93';
    return value >= 0 ? '#34C759' : '#FF3B30';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Neighborhood Intelligence</Text>
        <Text style={styles.subtitle}>Search by ZIP code for detailed market data</Text>
      </View>

      <Card style={styles.searchCard}>
        <CardContent>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Enter ZIP code (e.g., 78701)"
              value={zipCode}
              onChangeText={setZipCode}
              keyboardType="numeric"
              maxLength={5}
              style={styles.searchInput}
            />
            <Button
              onPress={handleSearch}
              disabled={zipCode.trim().length !== 5}
              style={styles.searchButton}
            >
              <Ionicons name="search" size={20} color="#fff" />
            </Button>
          </View>
        </CardContent>
      </Card>

      {isLoading && searchZip && (
        <Loading message="Loading neighborhood data..." />
      )}

      {error && (
        <Card>
          <CardContent>
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle-outline" size={64} color="#FF3B30" />
              <Text style={styles.emptyText}>Failed to load data</Text>
              <Text style={styles.emptySubtext}>
                Please check your ZIP code and try again.
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && trends.length === 0 && searchZip && (
        <Card>
          <CardContent>
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>No data found</Text>
              <Text style={styles.emptySubtext}>
                No neighborhood data available for ZIP code {searchZip}. Try a different ZIP code.
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && trends.length > 0 && (
        <View style={styles.trendsContainer}>
          {trends.map((trend, index) => (
            <Card key={trend.zipCode || index} style={styles.trendCard}>
              <CardHeader>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardTitle}>
                      {trend.neighborhood || `ZIP ${trend.zipCode}`}
                    </Text>
                    <Text style={styles.cardSubtitle}>
                      {[trend.city, trend.state, trend.zipCode ? `ZIP ${trend.zipCode}` : '']
                        .filter(Boolean)
                        .join(' • ')}
                    </Text>
                  </View>
                </View>
              </CardHeader>
              <CardContent>
                {/* Market Stats */}
                {trend.marketStats && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Market Snapshot</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Total Properties</Text>
                        <Text style={styles.statValue}>
                          {formatNumber(trend.marketStats.totalProperties)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Median Sale Price</Text>
                        <Text style={styles.statValue}>
                          {formatCurrency(trend.marketStats.medianSalePrice)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Price / Sq Ft</Text>
                        <Text style={styles.statValue}>
                          {formatCurrency(trend.marketStats.avgPricePerSqft)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Median Size</Text>
                        <Text style={styles.statValue}>
                          {trend.marketStats.medianBuildingSize
                            ? `${Math.round(trend.marketStats.medianBuildingSize).toLocaleString()} sq ft`
                            : 'N/A'}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Avg Year Built</Text>
                        <Text style={styles.statValue}>
                          {formatNumber(trend.marketStats.avgYearBuilt)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Owner Occupancy</Text>
                        <Text style={styles.statValue}>
                          {trend.marketStats.ownerOccupancyRate
                            ? `${(trend.marketStats.ownerOccupancyRate * 100).toFixed(1)}%`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Price & Rent Trends */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Price & Rent Trends</Text>
                  <View style={styles.trendsRow}>
                    <View style={styles.trendBox}>
                      <Text style={styles.trendLabel}>Average Price</Text>
                      <Text style={styles.trendValue}>
                        {formatCurrency(trend.averagePrice)}
                      </Text>
                      {trend.priceChangePercent1Year !== undefined && (
                        <View style={styles.trendChange}>
                          <Ionicons
                            name={getTrendIcon(trend.priceChangePercent1Year)}
                            size={16}
                            color={getTrendColor(trend.priceChangePercent1Year)}
                          />
                          <Text
                            style={[
                              styles.trendPercent,
                              { color: getTrendColor(trend.priceChangePercent1Year) },
                            ]}
                          >
                            {formatPercent(trend.priceChangePercent1Year)} YoY
                          </Text>
                        </View>
                      )}
                      <View style={styles.trendSubChanges}>
                        {trend.priceChangePercent6Month !== undefined && (
                          <Text style={styles.trendSubText}>
                            6mo: {formatPercent(trend.priceChangePercent6Month)}
                          </Text>
                        )}
                        {trend.priceChangePercent3Month !== undefined && (
                          <Text style={styles.trendSubText}>
                            3mo: {formatPercent(trend.priceChangePercent3Month)}
                          </Text>
                        )}
                      </View>
                    </View>

                    <View style={styles.trendBox}>
                      <Text style={styles.trendLabel}>Average Rent</Text>
                      <Text style={styles.trendValue}>
                        {formatCurrency(trend.averageRent)}
                      </Text>
                      {trend.rentChangePercent1Year !== undefined && (
                        <View style={styles.trendChange}>
                          <Ionicons
                            name={getTrendIcon(trend.rentChangePercent1Year)}
                            size={16}
                            color={getTrendColor(trend.rentChangePercent1Year)}
                          />
                          <Text
                            style={[
                              styles.trendPercent,
                              { color: getTrendColor(trend.rentChangePercent1Year) },
                            ]}
                          >
                            {formatPercent(trend.rentChangePercent1Year)} YoY
                          </Text>
                        </View>
                      )}
                      {trend.rentYield !== undefined && (
                        <Text style={styles.rentYield}>
                          Yield: {(trend.rentYield * 100).toFixed(2)}%
                        </Text>
                      )}
                    </View>
                  </View>
                </View>

                {/* Demographics */}
                {trend.demographics && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Demographics</Text>
                    <View style={styles.statsGrid}>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Population</Text>
                        <Text style={styles.statValue}>
                          {formatNumber(trend.demographics.population)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Median Income</Text>
                        <Text style={styles.statValue}>
                          {formatCurrency(trend.demographics.medianIncome)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Median Age</Text>
                        <Text style={styles.statValue}>
                          {formatNumber(trend.demographics.medianAge)}
                        </Text>
                      </View>
                      <View style={styles.statBox}>
                        <Text style={styles.statLabel}>Unemployment</Text>
                        <Text style={styles.statValue}>
                          {trend.demographics.unemploymentRate
                            ? `${(trend.demographics.unemploymentRate * 100).toFixed(1)}%`
                            : 'N/A'}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}

                {trend.lastUpdated && (
                  <Text style={styles.lastUpdated}>
                    Updated: {new Date(trend.lastUpdated).toLocaleDateString()}
                  </Text>
                )}
              </CardContent>
            </Card>
          ))}
        </View>
      )}

      {!searchZip && (
        <Card>
          <CardContent>
            <View style={styles.emptyContainer}>
              <Ionicons name="location-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>Search by ZIP Code</Text>
              <Text style={styles.emptySubtext}>
                Enter a 5-digit ZIP code above to view detailed neighborhood market data, demographics, and trends.
              </Text>
            </View>
          </CardContent>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  searchCard: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  searchInput: {
    flex: 1,
  },
  searchButton: {
    minWidth: 50,
    paddingHorizontal: 16,
  },
  trendsContainer: {
    gap: 16,
  },
  trendCard: {
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1C1C1E',
  },
  trendsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  trendBox: {
    flex: 1,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  trendLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
    marginBottom: 4,
  },
  trendValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  trendChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendPercent: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  trendSubChanges: {
    marginTop: 4,
    gap: 2,
  },
  trendSubText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  rentYield: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
});

