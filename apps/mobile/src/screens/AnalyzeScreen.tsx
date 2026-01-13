import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { analysisApi } from '../services/api';
import type { DealAnalysis } from '@dealanalyzer/types';

export default function AnalyzeScreen() {
  const route = useRoute();
  const { getToken } = useAuth();
  const analysisId = (route.params as any)?.analysisId;

  const { data: analysis, isLoading, isError, error } = useQuery<DealAnalysis>({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      if (!analysisId) {
        throw new Error('No analysis ID provided');
      }
      try {
        const result = await analysisApi.getById(analysisId, getToken);
        console.log('[AnalyzeScreen] Analysis loaded:', result);
        return result;
      } catch (err: any) {
        console.error('[AnalyzeScreen] Error loading analysis:', err.response?.data || err.message);
        throw err;
      }
    },
    enabled: !!analysisId,
  });

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

  // Show empty state if no analysisId (opened as tab without navigation)
  if (!analysisId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>
          No analysis selected{'\n'}
          Navigate here from a property analysis to view results
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading analysis...</Text>
      </View>
    );
  }

  if (isError || !analysis) {
    const errorMessage = error instanceof Error 
      ? error.message 
      : (error as any)?.response?.data?.error 
      || 'Failed to load analysis';
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load analysis</Text>
        <Text style={[styles.errorText, { fontSize: 12, marginTop: 8 }]}>
          {errorMessage}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Analysis Results</Text>

      {/* Property Info */}
      {analysis.property && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Details</Text>
          {analysis.property.address && (
            <Text style={styles.detail}>Address: {analysis.property.address}</Text>
          )}
          {analysis.property.purchasePrice && (
            <Text style={styles.detail}>
              Price: {formatCurrency(analysis.property.purchasePrice)}
            </Text>
          )}
          {analysis.property.bedrooms && (
            <Text style={styles.detail}>
              Bedrooms: {analysis.property.bedrooms}
            </Text>
          )}
          {analysis.property.bathrooms && (
            <Text style={styles.detail}>
              Bathrooms: {analysis.property.bathrooms}
            </Text>
          )}
          {analysis.property.sqft && (
            <Text style={styles.detail}>
              Square Feet: {analysis.property.sqft.toLocaleString()}
            </Text>
          )}
        </View>
      )}

      {/* Financial Metrics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Financial Metrics</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cash Flow:</Text>
          <Text
            style={[
              styles.metricValue,
              { color: (analysis.cashFlow || 0) > 0 ? '#28a745' : '#dc3545' },
            ]}
          >
            {formatCurrency(analysis.cashFlow)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cash on Cash Return:</Text>
          <Text style={styles.metricValue}>
            {formatPercent(analysis.cocReturn)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cap Rate:</Text>
          <Text style={styles.metricValue}>
            {formatPercent(analysis.capRate)}
          </Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Total Cash Needed:</Text>
          <Text style={styles.metricValue}>
            {formatCurrency(analysis.totalCashNeeded)}
          </Text>
        </View>
        {analysis.monthlyRevenue && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Monthly Revenue:</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(analysis.monthlyRevenue)}
            </Text>
          </View>
        )}
        {analysis.totalMonthlyExpenses && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Monthly Expenses:</Text>
            <Text style={styles.metricValue}>
              {formatCurrency(analysis.totalMonthlyExpenses)}
            </Text>
          </View>
        )}
      </View>

      {/* Criteria Assessment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Criteria Assessment</Text>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: analysis.meetsCriteria ? '#d4edda' : '#f8d7da',
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              { color: analysis.meetsCriteria ? '#155724' : '#721c24' },
            ]}
          >
            {analysis.meetsCriteria ? '✓ Meets Criteria' : '✗ Does Not Meet Criteria'}
          </Text>
        </View>
      </View>

      {/* AI Analysis */}
      {analysis.aiAnalysis && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Insights</Text>
          {analysis.aiAnalysis.propertyAssessment && (
            <>
              <Text style={styles.detail}>
                Overall Score: {analysis.aiAnalysis.propertyAssessment.overallScore}/10
              </Text>
              <Text style={styles.detail}>
                {analysis.aiAnalysis.propertyAssessment.description}
              </Text>
              {analysis.aiAnalysis.propertyAssessment.strengths &&
                analysis.aiAnalysis.propertyAssessment.strengths.length > 0 && (
                  <View style={styles.listSection}>
                    <Text style={styles.listTitle}>Strengths:</Text>
                    {analysis.aiAnalysis.propertyAssessment.strengths.map(
                      (strength: string, index: number) => (
                        <Text key={index} style={styles.listItem}>
                          • {strength}
                        </Text>
                      )
                    )}
                  </View>
                )}
              {analysis.aiAnalysis.propertyAssessment.redFlags &&
                analysis.aiAnalysis.propertyAssessment.redFlags.length > 0 && (
                  <View style={styles.listSection}>
                    <Text style={styles.listTitle}>Red Flags:</Text>
                    {analysis.aiAnalysis.propertyAssessment.redFlags.map(
                      (flag: string, index: number) => (
                        <Text key={index} style={styles.listItem}>
                          • {flag}
                        </Text>
                      )
                    )}
                  </View>
                )}
            </>
          )}
          {analysis.aiAnalysis.investmentRecommendation && (
            <View style={styles.recommendationSection}>
              <Text style={styles.recommendationTitle}>Recommendation:</Text>
              <Text style={styles.recommendationText}>
                {analysis.aiAnalysis.investmentRecommendation.recommendation}
              </Text>
            </View>
          )}
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
  errorText: {
    fontSize: 16,
    color: '#dc3545',
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
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
  detail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
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
  statusBadge: {
    padding: 12,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    marginTop: 12,
  },
  listTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  recommendationSection: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e9',
    borderRadius: 8,
  },
  recommendationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#333',
  },
});










