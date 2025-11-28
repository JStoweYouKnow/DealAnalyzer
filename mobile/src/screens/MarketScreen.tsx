import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { apiClient } from '../services/api';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface MarketData {
  city: string;
  state: string;
  medianPrice: number;
  medianRent: number;
  capRate?: number; // Some APIs return this
  averageCapRate?: number; // RentCast API returns this
  marketScore: number;
  trend?: 'up' | 'down' | 'stable';
  trends?: {
    priceChange: number;
    rentChange: number;
  };
}

export default function MarketScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: marketData = [], isLoading, refetch, error } = useQuery<MarketData[]>({
    queryKey: ['market-data'],
    queryFn: async () => {
      try {
        // Market data is public - use unauthenticated client
        console.log('📊 Fetching market data (public endpoint)...');
        const response = await apiClient.get('/market/cached-stats');
        const data = response.data || response;
        // API returns { success: true, data: [...] } or { success: true, data: {...}, metadata: {...} }
        const marketData = data.data || data.markets || data || [];
        console.log('✅ Market data fetched:', marketData.length, 'markets');
        return Array.isArray(marketData) ? marketData : [];
      } catch (err: any) {
        console.error('Failed to fetch market data:', err);
        // Check if it's a network error
        if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
          console.warn('API server is not reachable. Please check your API URL configuration.');
        }
        return [];
      }
    },
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return <Loading message="Loading market data..." />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Market Intelligence</Text>
            <Text style={styles.subtitle}>Real-time market data and trends</Text>
          </View>
          <Button
            onPress={() => navigation.navigate('Neighborhood')}
            style={styles.neighborhoodButton}
          >
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.neighborhoodButtonText}>ZIP Search</Text>
          </Button>
        </View>
      </View>

      {marketData.length === 0 ? (
        <Card>
          <CardContent>
            <View style={styles.emptyContainer}>
              <Ionicons name="analytics-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyText}>
                {error && (error as any)?.message?.includes('Network Error')
                  ? 'API Server Not Available'
                  : 'No market data available'}
              </Text>
              {error && (error as any)?.message?.includes('Network Error') && (
                <Text style={styles.emptySubtext}>
                  Please check your API URL configuration in app.json. The API server may not be running or reachable.
                </Text>
              )}
            </View>
          </CardContent>
        </Card>
      ) : (
        marketData.map((market, index) => (
          <Card key={index} style={styles.marketCard}>
            <CardHeader>
              <Text style={styles.marketTitle}>
                {market.city}, {market.state}
              </Text>
            </CardHeader>
            <CardContent>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Median Price</Text>
                  <Text style={styles.metricValue}>
                    ${market.medianPrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Median Rent</Text>
                  <Text style={styles.metricValue}>
                    ${market.medianRent.toLocaleString()}/mo
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Cap Rate</Text>
                  <Text style={styles.metricValue}>
                    {(() => {
                      // Handle both capRate and averageCapRate fields
                      // API returns cap rate as percentage (e.g., 5.0 for 5%)
                      const capRate = market.capRate ?? market.averageCapRate ?? 0;
                      // Ensure it's a valid number and not NaN
                      const validCapRate = Number.isFinite(capRate) && !isNaN(capRate) && capRate >= 0 ? capRate : 0;
                      // API returns as percentage already, so display directly
                      return `${validCapRate.toFixed(2)}%`;
                    })()}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Market Score</Text>
                  <View style={styles.scoreContainer}>
                    <Text style={styles.metricValue}>{market.marketScore}</Text>
                    <Ionicons
                      name="star"
                      size={16}
                      color="#FF9500"
                      style={styles.starIcon}
                    />
                  </View>
                </View>
              </View>

              {market.trends && (
                <View style={styles.trendsContainer}>
                  <Text style={styles.trendsTitle}>Trends</Text>
                  <View style={styles.trendRow}>
                    <Ionicons
                      name={
                        market.trends.priceChange >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={16}
                      color={market.trends.priceChange >= 0 ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        {
                          color:
                            market.trends.priceChange >= 0 ? '#34C759' : '#FF3B30',
                        },
                      ]}
                    >
                      Price: {market.trends.priceChange >= 0 ? '+' : ''}
                      {market.trends.priceChange.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.trendRow}>
                    <Ionicons
                      name={
                        market.trends.rentChange >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={16}
                      color={market.trends.rentChange >= 0 ? '#34C759' : '#FF3B30'}
                    />
                    <Text
                      style={[
                        styles.trendText,
                        {
                          color:
                            market.trends.rentChange >= 0 ? '#34C759' : '#FF3B30',
                        },
                      ]}
                    >
                      Rent: {market.trends.rentChange >= 0 ? '+' : ''}
                      {market.trends.rentChange.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              )}
            </CardContent>
          </Card>
        ))
      )}
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
  header: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  neighborhoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  neighborhoodButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  marketCard: {
    marginBottom: 16,
  },
  marketTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metric: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starIcon: {
    marginLeft: 4,
  },
  trendsContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  trendsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  trendText: {
    fontSize: 14,
    marginLeft: 8,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 16,
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
