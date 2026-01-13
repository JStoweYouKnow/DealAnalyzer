import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { CONFIG } from '../config';
import type { DealAnalysis } from '@dealanalyzer/types';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function ComparisonScreen() {
  const { getToken } = useAuth();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: analyses = [], isLoading } = useQuery<DealAnalysis[]>({
    queryKey: ['analysis-history'],
    queryFn: async () => {
      const token = await getToken();
      const response = await axios.get(`${API_BASE_URL}/api/history`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
  });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((selectedId) => selectedId !== id)
        : prev.length < 5
        ? [...prev, id]
        : prev
    );
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
    return `${(value * 100).toFixed(2)}%`;
  };

  const selectedAnalyses = analyses.filter((a) =>
    selectedIds.includes(a.id || '')
  );

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading analyses...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Property Comparison</Text>
      <Text style={styles.subtitle}>
        Select up to 5 properties to compare ({selectedIds.length}/5)
      </Text>

      {/* Property Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Select Properties</Text>
        {analyses.length === 0 ? (
          <Text style={styles.emptyText}>No analyses available</Text>
        ) : (
          analyses.slice(0, 10).map((analysis) => {
            const isSelected = selectedIds.includes(analysis.id || '');
            const isFull = selectedIds.length >= 5 && !isSelected;

            return (
              <TouchableOpacity
                key={analysis.id}
                style={[
                  styles.propertyCard,
                  isSelected && styles.propertyCardSelected,
                  isFull && styles.propertyCardDisabled,
                ]}
                onPress={() => toggleSelection(analysis.id || '')}
                disabled={isFull}
              >
                <Text style={styles.propertyAddress} numberOfLines={2}>
                  {analysis.property?.address || 'Unknown Address'}
                </Text>
                <Text style={styles.propertyPrice}>
                  {formatCurrency(analysis.property?.purchasePrice)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: analysis.meetsCriteria
                        ? '#d4edda'
                        : '#f8d7da',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: analysis.meetsCriteria ? '#155724' : '#721c24',
                      },
                    ]}
                  >
                    {analysis.meetsCriteria ? '✓ Meets' : '✗ Does Not Meet'}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Comparison Table */}
      {selectedAnalyses.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Comparison</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={true}>
            <View>
              {/* Header */}
              <View style={styles.tableRow}>
                <View style={styles.tableCellHeader}>
                  <Text style={styles.tableHeaderText}>Metric</Text>
                </View>
                {selectedAnalyses.map((analysis) => (
                  <View key={analysis.id} style={styles.tableCellHeader}>
                    <Text
                      style={styles.tableHeaderText}
                      numberOfLines={2}
                    >
                      {analysis.property?.address || 'Unknown'}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Cash Flow */}
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableLabel}>Cash Flow</Text>
                </View>
                {selectedAnalyses.map((analysis) => (
                  <View key={analysis.id} style={styles.tableCell}>
                    <Text
                      style={[
                        styles.tableValue,
                        {
                          color:
                            (analysis.cashFlow || 0) > 0 ? '#28a745' : '#dc3545',
                        },
                      ]}
                    >
                      {formatCurrency(analysis.cashFlow)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* CoC Return */}
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableLabel}>CoC Return</Text>
                </View>
                {selectedAnalyses.map((analysis) => (
                  <View key={analysis.id} style={styles.tableCell}>
                    <Text style={styles.tableValue}>
                      {formatPercent(analysis.cocReturn)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Cap Rate */}
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableLabel}>Cap Rate</Text>
                </View>
                {selectedAnalyses.map((analysis) => (
                  <View key={analysis.id} style={styles.tableCell}>
                    <Text style={styles.tableValue}>
                      {formatPercent(analysis.capRate)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Price */}
              <View style={styles.tableRow}>
                <View style={styles.tableCell}>
                  <Text style={styles.tableLabel}>Price</Text>
                </View>
                {selectedAnalyses.map((analysis) => (
                  <View key={analysis.id} style={styles.tableCell}>
                    <Text style={styles.tableValue}>
                      {formatCurrency(analysis.property?.purchasePrice)}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {selectedAnalyses.length === 0 && analyses.length > 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>
            Select properties above to compare
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
    marginBottom: 12,
    color: '#333',
  },
  propertyCard: {
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  propertyCardSelected: {
    borderColor: '#007bff',
    backgroundColor: '#e7f3ff',
  },
  propertyCardDisabled: {
    opacity: 0.5,
  },
  propertyAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  propertyPrice: {
    fontSize: 16,
    color: '#28a745',
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tableCellHeader: {
    width: 150,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  tableCell: {
    width: 150,
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
  },
  tableLabel: {
    fontSize: 14,
    color: '#666',
  },
  tableValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
});










