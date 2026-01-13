import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emailDealsApi, reportApi } from '../services/api';
import { downloadPDF, downloadCSV } from '../utils/fileDownload';
import type { EmailDeal, DealAnalysis } from '@dealanalyzer/types';

export default function DealDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  
  // Get deal ID from route params
  const dealId = (route.params as any)?.dealId;
  
  const [isEditing, setIsEditing] = useState(false);
  const [monthlyRent, setMonthlyRent] = useState<string>('');
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [downloadingFormat, setDownloadingFormat] = useState<'pdf' | 'csv' | null>(null);

  // Fetch deal details
  const { data: deal, isLoading } = useQuery({
    queryKey: ['email-deal', dealId],
    queryFn: () => emailDealsApi.getById(dealId, getToken),
    enabled: !!dealId,
  });

  // Update monthly rent mutation
  const updateRentMutation = useMutation({
    mutationFn: async (rent: number) => {
      return emailDealsApi.updateMonthlyRent(dealId, rent, getToken);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-deal', dealId] });
      queryClient.invalidateQueries({ queryKey: ['email-deals'] });
      setIsEditing(false);
      Alert.alert('Success', 'Monthly rent updated successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error?.message || 'Failed to update monthly rent');
    },
  });

  // Handle rent input change
  const handleRentChange = (value: string) => {
    // Allow only numbers and decimal point
    const numericValue = value.replace(/[^0-9.]/g, '');
    setMonthlyRent(numericValue);
  };

  // Handle save rent
  const handleSaveRent = () => {
    const rentValue = parseFloat(monthlyRent);
    if (isNaN(rentValue) || rentValue < 0) {
      Alert.alert('Invalid Input', 'Please enter a valid positive number');
      return;
    }
    updateRentMutation.mutate(rentValue);
  };

  // Handle download report
  const handleDownloadReport = async (format: 'pdf' | 'csv') => {
    if (!deal) return;

    try {
      setDownloadingFormat(format);
      const blob = await reportApi.generateReport([dealId], format, getToken);
      const fileName = `property-analysis-${deal.extractedProperty?.address || dealId}`;
      
      if (format === 'pdf') {
        await downloadPDF(blob, fileName);
      } else {
        await downloadCSV(blob, fileName);
      }
      
      Alert.alert('Success', `${format.toUpperCase()} downloaded successfully`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || `Failed to download ${format.toUpperCase()}`);
    } finally {
      setDownloadingFormat(null);
    }
  };

  // Format currency
  const formatCurrency = (value: number | undefined): string => {
    if (!value) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number | undefined): string => {
    if (value === undefined || value === null) return 'N/A';
    return `${(value * 100).toFixed(2)}%`;
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading deal details...</Text>
      </View>
    );
  }

  if (!deal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Deal not found</Text>
      </View>
    );
  }

  const currentRent = deal.extractedProperty?.monthlyRent || deal.analysis?.property?.monthlyRent;
  const analysis = deal.analysis;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Deal Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{deal.subject}</Text>
          <Text style={styles.sender}>From: {deal.sender}</Text>
          <Text style={styles.date}>
            {new Date(deal.receivedDate).toLocaleDateString()}
          </Text>
        </View>

        {/* Property Information */}
        {deal.extractedProperty && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Information</Text>
            {deal.extractedProperty.address && (
              <Text style={styles.infoText}>
                Address: {deal.extractedProperty.address}
              </Text>
            )}
            {deal.extractedProperty.city && deal.extractedProperty.state && (
              <Text style={styles.infoText}>
                Location: {deal.extractedProperty.city}, {deal.extractedProperty.state}
              </Text>
            )}
            {deal.extractedProperty.price && (
              <Text style={styles.infoText}>
                Price: {formatCurrency(deal.extractedProperty.price)}
              </Text>
            )}
            {deal.extractedProperty.bedrooms && (
              <Text style={styles.infoText}>
                Bedrooms: {deal.extractedProperty.bedrooms}
              </Text>
            )}
            {deal.extractedProperty.bathrooms && (
              <Text style={styles.infoText}>
                Bathrooms: {deal.extractedProperty.bathrooms}
              </Text>
            )}
            {deal.extractedProperty.sqft && (
              <Text style={styles.infoText}>
                Square Feet: {deal.extractedProperty.sqft.toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Monthly Rent Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Monthly Rent</Text>
          {isEditing ? (
            <View style={styles.editContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter monthly rent"
                value={monthlyRent || (currentRent?.toString() || '')}
                onChangeText={handleRentChange}
                keyboardType="numeric"
                autoFocus
              />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={() => {
                    setIsEditing(false);
                    setMonthlyRent('');
                  }}
                >
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.saveButton]}
                  onPress={handleSaveRent}
                  disabled={updateRentMutation.isPending}
                >
                  {updateRentMutation.isPending ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.rentDisplay}>
              <Text style={styles.rentValue}>
                {currentRent ? formatCurrency(currentRent) : 'Not specified'}
              </Text>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => {
                  setIsEditing(true);
                  setMonthlyRent(currentRent?.toString() || '');
                }}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Analysis Section */}
        {analysis && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analysis</Text>
            
            {!showAnalysis ? (
              <TouchableOpacity
                style={styles.viewAnalysisButton}
                onPress={() => setShowAnalysis(true)}
              >
                <Text style={styles.viewAnalysisButtonText}>View Analysis</Text>
              </TouchableOpacity>
            ) : (
              <View>
                {/* Key Metrics */}
                <View style={styles.metricsContainer}>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Cash Flow</Text>
                    <Text
                      style={[
                        styles.metricValue,
                        analysis.cashFlowPositive ? styles.positive : styles.negative,
                      ]}
                    >
                      {formatCurrency(analysis.cashFlow)}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Cash on Cash ROI</Text>
                    <Text style={styles.metricValue}>
                      {formatPercent(analysis.cocReturn)}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Cap Rate</Text>
                    <Text style={styles.metricValue}>
                      {formatPercent(analysis.capRate)}
                    </Text>
                  </View>
                  <View style={styles.metric}>
                    <Text style={styles.metricLabel}>Total Cash Needed</Text>
                    <Text style={styles.metricValue}>
                      {formatCurrency(analysis.totalCashNeeded)}
                    </Text>
                  </View>
                </View>

                {/* Download Buttons */}
                <View style={styles.downloadContainer}>
                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      downloadingFormat === 'pdf' && styles.downloadButtonDisabled,
                    ]}
                    onPress={() => handleDownloadReport('pdf')}
                    disabled={!!downloadingFormat}
                  >
                    {downloadingFormat === 'pdf' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.downloadButtonText}>Download PDF</Text>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.downloadButton,
                      styles.downloadButtonSecondary,
                      downloadingFormat === 'csv' && styles.downloadButtonDisabled,
                    ]}
                    onPress={() => handleDownloadReport('csv')}
                    disabled={!!downloadingFormat}
                  >
                    {downloadingFormat === 'csv' ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.downloadButtonText}>Download CSV</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.hideButton}
                  onPress={() => setShowAnalysis(false)}
                >
                  <Text style={styles.hideButtonText}>Hide Analysis</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Email Content */}
        {deal.emailContent && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Email Content</Text>
            <Text style={styles.emailContent}>{deal.emailContent}</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 16,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#e74c3c',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  sender: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  editContainer: {
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e0e0e0',
  },
  saveButton: {
    backgroundColor: '#3498db',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  rentDisplay: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  rentValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3498db',
    borderRadius: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewAnalysisButton: {
    backgroundColor: '#3498db',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAnalysisButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  metricsContainer: {
    marginTop: 12,
  },
  metric: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metricLabel: {
    fontSize: 14,
    color: '#666',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  positive: {
    color: '#27ae60',
  },
  negative: {
    color: '#e74c3c',
  },
  downloadContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  downloadButton: {
    flex: 1,
    backgroundColor: '#3498db',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  downloadButtonSecondary: {
    backgroundColor: '#27ae60',
  },
  downloadButtonDisabled: {
    opacity: 0.6,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  hideButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
  },
  hideButtonText: {
    color: '#666',
    fontSize: 14,
  },
  emailContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});










