import React from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Loading } from '../components/ui/Loading';
import { useApiClient } from '../services/api';

type AnalyzeScreenRouteProp = RouteProp<RootStackParamList, 'Analyze'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const formatCurrency = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return 'N/A';
  return `$${Number(value).toLocaleString()}`;
};

export default function AnalyzeScreen() {
  const route = useRoute<AnalyzeScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const apiClient = useApiClient();

  const [analysisData, setAnalysisData] = React.useState<any | null>(
    route.params?.initialData || null
  );

  const dealId = route.params?.dealId;

  // Helper to normalize API responses that may be wrapped in { success, data } or direct
  const normalizeResponse = (response: any): any => {
    // Handle axios response.data or direct response
    const data = response?.data ?? response;
    // Unwrap { success: true, data: ... } format
    if (data?.success === true && data?.data) {
      return data.data;
    }
    // Return direct data
    return data;
  };

  const {
    data: dealDataRaw,
    isLoading: isDealLoading,
    error: dealError,
    refetch: refetchDeal,
  } = useQuery({
    queryKey: ['email-deal', dealId],
    queryFn: async () => {
      const response = await apiClient.get(`/email-deals/${dealId}`);
      return normalizeResponse(response);
    },
    enabled: !!dealId,
  });

  // Normalize deal data - handle both wrapped and direct responses
  const dealData = React.useMemo(() => {
    if (!dealDataRaw) return null;
    return normalizeResponse(dealDataRaw);
  }, [dealDataRaw]);

  const normalizeAnalysis = (payload: any) => {
    const normalized = normalizeResponse(payload);
    // The API returns the analysis object directly in { success: true, data: analysis }
    // After normalizeResponse, we should have the analysis object itself
    // But it might also be nested in .analysis if coming from a deal object
    if (normalized?.analysis) {
      // If it's nested in .analysis (from deal object), return that
      return normalized.analysis;
    }
    // Otherwise, the normalized result IS the analysis object
    return normalized || null;
  };

  React.useEffect(() => {
    if (dealData?.analysis) {
      setAnalysisData(dealData.analysis);
    }
  }, [dealData?.analysis]);

  const analyzeDealMutation = useMutation({
    mutationFn: async () => {
      console.log('[AnalyzeScreen] 🚀 Starting analysis mutation...');
      console.log('[AnalyzeScreen] Deal ID:', dealId);
      console.log('[AnalyzeScreen] Deal ID type:', dealId?.startsWith('k') ? 'Convex ID' : 'Gmail ID');
      console.log('[AnalyzeScreen] Deal ID length:', dealId?.length);
      
      if (!dealId) {
        console.warn('[AnalyzeScreen] ⚠️ Missing deal id');
        throw new Error('Missing deal id');
      }
      
      // Get emailContent from normalized deal data
      const emailContent = dealData?.emailContent;
      console.log('[AnalyzeScreen] Email content available:', !!emailContent);
      console.log('[AnalyzeScreen] Email content length:', emailContent?.length || 0);
      
      if (!emailContent) {
        console.warn('[AnalyzeScreen] ⚠️ Email content is missing');
        throw new Error('Email content is required to analyze this deal. Please ensure the deal has been loaded.');
      }

      const requestPayload = {
        dealId,
        emailContent,
      };
      
      console.log('[AnalyzeScreen] 📤 Sending request to /analyze-email-deal');
      console.log('[AnalyzeScreen] Request payload:', {
        dealId,
        emailContentLength: emailContent.length,
      });

      try {
        const response = await apiClient.post('/analyze-email-deal', requestPayload);
        console.log('[AnalyzeScreen] ✅ Received response from server');
        console.log('[AnalyzeScreen] Response type:', typeof response);
        console.log('[AnalyzeScreen] Response keys:', Object.keys(response || {}));
        console.log('[AnalyzeScreen] Response.data:', response?.data ? Object.keys(response.data) : 'no data');
        console.log('[AnalyzeScreen] Response.data.success:', response?.data?.success);
        console.log('[AnalyzeScreen] Response.data.data:', response?.data?.data ? Object.keys(response.data.data) : 'no data.data');
        // Return the full response - normalizeResponse will handle unwrapping
        return response;
      } catch (apiError: any) {
        // Use console.warn to prevent React Native error overlay
        console.warn('[AnalyzeScreen] ⚠️ API request failed');
        console.warn('[AnalyzeScreen] Error type:', typeof apiError);
        console.warn('[AnalyzeScreen] Error message:', apiError?.message);
        console.warn('[AnalyzeScreen] Error response:', apiError?.response?.data);
        console.warn('[AnalyzeScreen] Error status:', apiError?.response?.status);
        if (__DEV__) {
          console.warn('[AnalyzeScreen] Full error:', apiError);
        }
        throw apiError;
      }
    },
    onSuccess: async (result) => {
      console.log('[AnalyzeScreen] ✅ Analysis mutation succeeded');
      console.log('[AnalyzeScreen] Result type:', typeof result);
      console.log('[AnalyzeScreen] Result keys:', result ? Object.keys(result) : 'null');
      console.log('[AnalyzeScreen] Result.data:', result?.data ? Object.keys(result.data) : 'no data');
      
      const normalized = normalizeAnalysis(result);
      console.log('[AnalyzeScreen] Normalized analysis type:', typeof normalized);
      console.log('[AnalyzeScreen] Normalized analysis:', !!normalized);
      console.log('[AnalyzeScreen] Normalized keys:', normalized ? Object.keys(normalized) : 'null');
      console.log('[AnalyzeScreen] Has cashFlow:', !!normalized?.cashFlow);
      console.log('[AnalyzeScreen] Has property:', !!normalized?.property);
      
      if (normalized) {
        console.log('[AnalyzeScreen] Setting analysis data');
        setAnalysisData(normalized);
      } else {
        console.warn('[AnalyzeScreen] ⚠️ No normalized analysis data found');
        console.warn('[AnalyzeScreen] Raw result:', JSON.stringify(result, null, 2).substring(0, 1000));
      }
      
      // Refetch deal to get updated analysis
      if (refetchDeal) {
        console.log('[AnalyzeScreen] Refetching deal data...');
        await refetchDeal();
      }
    },
    onError: (error: any) => {
      // Use console.warn to prevent error overlay - errors are shown via Alert in UI
      console.warn('[AnalyzeScreen] ⚠️ Analysis mutation error');
      const errorMessage = error?.response?.data?.error || 
                          error?.response?.data?.message || 
                          error?.message || 
                          'Failed to analyze deal. Please try again.';
      console.warn('[AnalyzeScreen] Error message:', errorMessage);
      
      // Only log full details in development
      if (__DEV__) {
        console.warn('[AnalyzeScreen] Error object:', error);
        console.warn('[AnalyzeScreen] Error response data:', error?.response?.data);
        console.warn('[AnalyzeScreen] Error response status:', error?.response?.status);
        console.warn('[AnalyzeScreen] Error stack:', error?.stack);
      }
      
      // Show error alert to user
      Alert.alert(
        'Analysis Failed',
        errorMessage,
        [{ text: 'OK' }]
      );
    },
  });

  const loading = isDealLoading || analyzeDealMutation.isPending;

  if (loading) {
    return (
      <Loading
        message={
          analyzeDealMutation.isPending ? 'Analyzing deal...' : 'Loading deal...'
        }
      />
    );
  }

  if (!analysisData) {
    // Show deal info and analysis button if we have deal data
    if (dealId && dealData) {
      const property = dealData.extractedProperty || {};
      const hasEmailContent = !!dealData.emailContent;

      return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
          <Card>
            <CardHeader>
              <Text style={styles.title}>Analyze Deal</Text>
              <Text style={styles.sectionSubtitle}>
                Run analysis to see cash flow, cap rate, and criteria fit.
              </Text>
            </CardHeader>
            <CardContent>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Property Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{property.address || 'N/A'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Purchase Price:</Text>
                  <Text style={styles.infoValue}>
                    {property.price ? formatCurrency(property.price) : 'N/A'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Monthly Rent:</Text>
                  <Text style={styles.infoValue}>
                    {property.monthlyRent ? formatCurrency(property.monthlyRent) : 'N/A'}
                  </Text>
                </View>
              </View>

              {analyzeDealMutation.isError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>
                    {(analyzeDealMutation.error as any)?.response?.data?.error ||
                      (analyzeDealMutation.error as any)?.message ||
                      'Failed to analyze deal. Please try again.'}
                  </Text>
                </View>
              )}

              <Button
                title={analyzeDealMutation.isPending ? 'Analyzing...' : 'Run Analysis'}
                onPress={() => {
                  console.log('[AnalyzeScreen] 🔘 Run Analysis button pressed');
                  console.log('[AnalyzeScreen] Button state:', {
                    isPending: analyzeDealMutation.isPending,
                    hasEmailContent,
                    dealId,
                    dealDataPresent: !!dealData,
                  });
                  try {
                    analyzeDealMutation.mutate();
                  } catch (error) {
                    // Catch any synchronous errors to prevent error overlay
                    console.warn('[AnalyzeScreen] ⚠️ Error starting mutation:', error);
                  }
                }}
                style={styles.actionButton}
                disabled={!hasEmailContent || analyzeDealMutation.isPending}
                loading={analyzeDealMutation.isPending}
              />
              
              {!hasEmailContent && (
                <Text style={styles.warningText}>
                  Email content is missing. Cannot analyze this deal.
                </Text>
              )}

              <Button
                title="Go Back"
                onPress={() => navigation.goBack()}
                variant="outline"
                style={styles.backButton}
              />
            </CardContent>
          </Card>
        </ScrollView>
      );
    }

    // Show error state if we have an error
    if (dealError) {
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Failed to Load Deal</Text>
            <Text style={styles.errorText}>
              {(dealError as any)?.response?.data?.error ||
                (dealError as any)?.message ||
                'Failed to load deal details. Please check your connection and try again.'}
            </Text>
            <Button
              title="Retry"
              onPress={() => refetchDeal()}
              style={styles.actionButton}
            />
            <Button
              title="Go Back"
              onPress={() => navigation.goBack()}
              variant="outline"
              style={styles.backButton}
            />
          </View>
        </View>
      );
    }

    // Show empty state if no dealId or no data
    return (
      <View style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No analysis data available</Text>
          <Text style={styles.emptySubtext}>
            {dealId
              ? 'Deal data could not be loaded. Please try again.'
              : 'No deal selected. Please select a deal to analyze.'}
          </Text>
          {dealId && refetchDeal && (
            <Button
              title="Retry"
              onPress={() => refetchDeal()}
              style={styles.actionButton}
            />
          )}
          <Button
            title="Go Back"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
        </View>
      </View>
    );
  }

  const property = analysisData.property || dealData?.extractedProperty || {};

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CardHeader>
          <Text style={styles.title}>Analysis Details</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Property Information</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Address:</Text>
              <Text style={styles.infoValue}>
                {property?.address || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Price:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(
                  property?.purchasePrice || property?.price
                )}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monthly Rent:</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(property?.monthlyRent)}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Financial Metrics</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cash Flow:</Text>
              <Text
                style={[
                  styles.infoValue,
                  (analysisData.cashFlow || 0) >= 0 ? styles.positive : styles.negative,
                ]}
              >
                ${analysisData.cashFlow?.toFixed(2) || '0'}/month
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cash-on-Cash Return:</Text>
              <Text style={styles.infoValue}>
                {((analysisData.cocReturn || 0) * 100).toFixed(2)}%
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cap Rate:</Text>
              <Text style={styles.infoValue}>
                {((analysisData.capRate || 0) * 100).toFixed(2)}%
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Investment Criteria</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Meets Criteria:</Text>
              <Text
                style={[
                  styles.infoValue,
                  analysisData.meetsCriteria ? styles.positive : styles.negative,
                ]}
              >
                {analysisData.meetsCriteria ? 'Yes ✓' : 'No ✗'}
              </Text>
            </View>
          </View>

          <Button
            title="Add to Comparison"
            onPress={() => navigation.navigate('Comparison')}
            style={styles.actionButton}
          />
        </CardContent>
      </Card>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoLabel: {
    fontSize: 16,
    color: '#8E8E93',
  },
  infoValue: {
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
  actionButton: {
    marginTop: 16,
  },
  emptyText: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 32,
  },
  backButton: {
    marginTop: 16,
    marginHorizontal: 16,
  },
  errorContainer: {
    marginTop: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FF3B3010',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF3B3030',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    lineHeight: 20,
  },
  warningText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
