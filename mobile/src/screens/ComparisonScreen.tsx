import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface ComparisonProperty {
  propertyId: string;
  property: {
    address: string;
    purchasePrice: number;
    monthlyRent: number;
  };
  cashFlow: number;
  cocReturn: number;
  capRate: number;
  meetsCriteria: boolean;
}

export default function ComparisonScreen() {
  const [comparisons, setComparisons] = useState<ComparisonProperty[]>([]);

  useEffect(() => {
    loadComparisons();
  }, []);

  const loadComparisons = async () => {
    try {
      const stored = await AsyncStorage.getItem('comparisonProperties');
      if (stored) {
        setComparisons(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load comparisons:', error);
    }
  };

  const clearComparisons = async () => {
    try {
      await AsyncStorage.removeItem('comparisonProperties');
      setComparisons([]);
    } catch (error) {
      console.error('Failed to clear comparisons:', error);
    }
  };

  if (comparisons.length === 0) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.emptyContent}>
          <Text style={styles.emptyTitle}>No Properties to Compare</Text>
          <Text style={styles.emptyText}>
            Add properties from analysis results to compare them side by side
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Property Comparison</Text>
          <Text style={styles.subtitle}>
            Compare {comparisons.length} propert{comparisons.length === 1 ? 'y' : 'ies'}
          </Text>
        </View>

        {comparisons.map((comparison, index) => (
          <Card key={index} style={styles.comparisonCard}>
            <CardHeader>
              <Text style={styles.propertyAddress}>
                {comparison.property.address}
              </Text>
            </CardHeader>
            <CardContent>
              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Purchase Price</Text>
                  <Text style={styles.metricValue}>
                    ${comparison.property.purchasePrice.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Monthly Rent</Text>
                  <Text style={styles.metricValue}>
                    ${comparison.property.monthlyRent.toLocaleString()}
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Cash Flow</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      comparison.cashFlow >= 0 ? styles.positive : styles.negative,
                    ]}
                  >
                    ${comparison.cashFlow.toFixed(2)}/mo
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>CoC Return</Text>
                  <Text style={styles.metricValue}>
                    {(comparison.cocReturn * 100).toFixed(2)}%
                  </Text>
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Cap Rate</Text>
                  <Text style={styles.metricValue}>
                    {(comparison.capRate * 100).toFixed(2)}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Meets Criteria</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      comparison.meetsCriteria ? styles.positive : styles.negative,
                    ]}
                  >
                    {comparison.meetsCriteria ? 'Yes ✓' : 'No ✗'}
                  </Text>
                </View>
              </View>
            </CardContent>
          </Card>
        ))}

        <Button
          title="Clear All Comparisons"
          onPress={clearComparisons}
          variant="destructive"
          style={styles.clearButton}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  header: {
    marginBottom: 24,
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
  comparisonCard: {
    marginBottom: 16,
  },
  propertyAddress: {
    fontSize: 18,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  positive: {
    color: '#34C759',
  },
  negative: {
    color: '#FF3B30',
  },
  clearButton: {
    marginTop: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
