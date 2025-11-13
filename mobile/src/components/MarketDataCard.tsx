import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { marketDataService } from '../services/api';

/**
 * MarketDataCard Component
 *
 * Example component showing how to integrate free market data APIs
 * into your mobile app screens.
 *
 * Usage:
 * <MarketDataCard address="123 Main St, Dallas, TX 75201" />
 */

interface MarketDataCardProps {
  address: string;
  lat?: number;
  lon?: number;
  countyFips?: string;
}

export default function MarketDataCard({
  address,
  lat,
  lon,
  countyFips
}: MarketDataCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [expanded, setExpanded] = useState({
    walkability: false,
    weather: false,
    employment: false,
    economy: false,
  });

  const fetchMarketData = useCallback(async () => {
    if (!address) return;

    setLoading(true);
    setError(null);

    try {
      const result = await marketDataService.getMarketIntelligence({
        address,
        lat,
        lon,
        countyFips,
      });
      setData(result);
    } catch (err) {
      setError('Failed to load market data');
      console.error('Market data error:', err);
    } finally {
      setLoading(false);
    }
  }, [address, lat, lon, countyFips]);

  useEffect(() => {
    fetchMarketData();
  }, [fetchMarketData]);

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading market intelligence...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchMarketData}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Free Market Intelligence</Text>
      <Text style={styles.subtitle}>{address}</Text>

      {/* Location Info */}
      {data.location && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Coordinates:</Text>
            <Text style={styles.value}>
              {data.location.lat?.toFixed(6)}, {data.location.lon?.toFixed(6)}
            </Text>
          </View>
          {data.location.county && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>County:</Text>
              <Text style={styles.value}>{data.location.county}</Text>
            </View>
          )}
          {data.location.zipCode && (
            <View style={styles.infoRow}>
              <Text style={styles.label}>ZIP Code:</Text>
              <Text style={styles.value}>{data.location.zipCode}</Text>
            </View>
          )}
        </View>
      )}

      {/* Walkability Scores */}
      {data.walkability && Object.keys(data.walkability).length > 0 && (
        <TouchableOpacity
          style={styles.section}
          onPress={() => toggleSection('walkability')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚶 Walkability Scores</Text>
            <Text style={styles.expandIcon}>{expanded.walkability ? '▼' : '▶'}</Text>
          </View>
          {expanded.walkability && (
            <>
              {data.walkability.walkScore !== undefined && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Walk Score</Text>
                  <Text style={[styles.scoreValue, getScoreColor(data.walkability.walkScore)]}>
                    {data.walkability.walkScore}
                  </Text>
                  <Text style={styles.scoreDescription}>
                    {getWalkScoreDescription(data.walkability.walkScore)}
                  </Text>
                </View>
              )}
              {data.walkability.transitScore !== undefined && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Transit Score</Text>
                  <Text style={[styles.scoreValue, getScoreColor(data.walkability.transitScore)]}>
                    {data.walkability.transitScore}
                  </Text>
                </View>
              )}
              {data.walkability.bikeScore !== undefined && (
                <View style={styles.scoreCard}>
                  <Text style={styles.scoreLabel}>Bike Score</Text>
                  <Text style={[styles.scoreValue, getScoreColor(data.walkability.bikeScore)]}>
                    {data.walkability.bikeScore}
                  </Text>
                </View>
              )}
              <Text style={styles.apiCredit}>Data from Walk Score API</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Weather & Climate */}
      {data.weather && Object.keys(data.weather).length > 0 && (
        <TouchableOpacity
          style={styles.section}
          onPress={() => toggleSection('weather')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🌤️ Current Weather</Text>
            <Text style={styles.expandIcon}>{expanded.weather ? '▼' : '▶'}</Text>
          </View>
          {expanded.weather && (
            <>
              {data.weather.temp !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Temperature:</Text>
                  <Text style={styles.value}>{Math.round(data.weather.temp)}°F</Text>
                </View>
              )}
              {data.weather.humidity !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Humidity:</Text>
                  <Text style={styles.value}>{data.weather.humidity}%</Text>
                </View>
              )}
              {data.weather.description && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Conditions:</Text>
                  <Text style={styles.value}>{data.weather.description}</Text>
                </View>
              )}
              <Text style={styles.apiCredit}>Data from OpenWeatherMap API</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Employment Data */}
      {data.employment && Object.keys(data.employment).length > 0 && (
        <TouchableOpacity
          style={styles.section}
          onPress={() => toggleSection('employment')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💼 Employment Stats</Text>
            <Text style={styles.expandIcon}>{expanded.employment ? '▼' : '▶'}</Text>
          </View>
          {expanded.employment && (
            <>
              {data.employment.unemploymentRate !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Unemployment Rate:</Text>
                  <Text style={styles.value}>{data.employment.unemploymentRate.toFixed(1)}%</Text>
                </View>
              )}
              {data.employment.laborForce !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Labor Force:</Text>
                  <Text style={styles.value}>{data.employment.laborForce.toLocaleString()}</Text>
                </View>
              )}
              <Text style={styles.apiCredit}>Data from Bureau of Labor Statistics (Free)</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Economic Indicators */}
      {data.economy && Object.keys(data.economy).length > 0 && (
        <TouchableOpacity
          style={styles.section}
          onPress={() => toggleSection('economy')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📊 Economic Indicators</Text>
            <Text style={styles.expandIcon}>{expanded.economy ? '▼' : '▶'}</Text>
          </View>
          {expanded.economy && (
            <>
              {data.economy.mortgageRate !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>30-Year Mortgage Rate:</Text>
                  <Text style={styles.value}>{data.economy.mortgageRate.toFixed(2)}%</Text>
                </View>
              )}
              {data.economy.homePriceIndex !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Home Price Index:</Text>
                  <Text style={styles.value}>{data.economy.homePriceIndex.toFixed(2)}</Text>
                </View>
              )}
              {data.economy.homePriceChange !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Price Change (YoY):</Text>
                  <Text style={[
                    styles.value,
                    data.economy.homePriceChange > 0 ? styles.positive : styles.negative
                  ]}>
                    {data.economy.homePriceChange > 0 ? '+' : ''}
                    {data.economy.homePriceChange.toFixed(1)}%
                  </Text>
                </View>
              )}
              <Text style={styles.apiCredit}>Data from Federal Reserve (FRED) API</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All data sources are free public APIs with no cost to use.
        </Text>
      </View>
    </ScrollView>
  );
}

// Helper functions
function getWalkScoreDescription(score: number): string {
  if (score >= 90) return "Walker's Paradise";
  if (score >= 70) return 'Very Walkable';
  if (score >= 50) return 'Somewhat Walkable';
  if (score >= 25) return 'Car-Dependent';
  return 'Very Car-Dependent';
}

function getScoreColor(score: number) {
  if (score >= 70) return { color: '#34C759' }; // Green
  if (score >= 50) return { color: '#FF9500' }; // Orange
  return { color: '#FF3B30' }; // Red
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 24,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  expandIcon: {
    fontSize: 12,
    color: '#8E8E93',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: '#8E8E93',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  scoreCard: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    marginBottom: 8,
  },
  scoreLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  scoreDescription: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  apiCredit: {
    fontSize: 10,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: 8,
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  footer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#E5E5EA',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
