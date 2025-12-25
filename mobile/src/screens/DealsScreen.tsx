import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Image,
  Linking,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@clerk/clerk-expo';
import { RootStackParamList } from '../types';
import { Card, CardContent } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { useApiClient } from '../services/api';
import type { EmailDeal } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function DealsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [archivingDealId, setArchivingDealId] = useState<string | null>(null);
  const [editingDeal, setEditingDeal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: {price?: string, rent?: string}}>({});
  const { isSignedIn, isLoaded } = useAuth();
  const apiClient = useApiClient();
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading, refetch, error } = useQuery<EmailDeal[]>({
    queryKey: ['email-deals'],
    queryFn: async () => {
      // Don't make API call if user is not signed in
      if (!isLoaded || !isSignedIn) {
        console.warn('⚠️ User not signed in - skipping API call');
        return [];
      }
      
      try {
        console.log('📡 Fetching email deals...');
        const response = await apiClient.get('/email-deals');
        console.log('✅ Email deals fetched successfully');
        return response.data || response;
      } catch (err: any) {
        console.error('❌ Failed to fetch email deals:', err);
        
        // Log detailed error information
        if (err.response) {
          console.error('Error response:', {
            status: err.response.status,
            statusText: err.response.statusText,
            data: err.response.data,
          });
        }
        
        // Check if it's a network error
        if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
          console.warn('API server is not reachable. Please check your API URL configuration.');
        }
        // Check if it's an auth error
        else if (err.response?.status === 401) {
          console.warn('⚠️ Authentication failed - user may need to sign in again');
        }
        // Check if it's a server error (500)
        else if (err.response?.status === 500) {
          const errorMessage = err.response?.data?.error || err.message || 'Server error';
          console.error('⚠️ Server error (500):', errorMessage);
          console.warn('This may indicate an issue with the API server or database connection.');
        }
        
        // Return empty array on error instead of crashing
        return [];
      }
    },
    enabled: isLoaded && isSignedIn === true, // Only run query if user is signed in
    retry: false,
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleArchiveDeal = async (dealId: string) => {
    if (archivingDealId) return; // Prevent multiple simultaneous archives

    setArchivingDealId(dealId);
    try {
      console.log('📦 Archiving deal:', dealId);
      await apiClient.post(`/email-deals/${dealId}/archive`);
      console.log('✅ Deal archived successfully');

      // Invalidate and refetch the deals list
      await queryClient.invalidateQueries({ queryKey: ['email-deals'] });

      // Show success feedback
      Alert.alert('Success', 'Deal archived successfully');
    } catch (error: any) {
      console.error('❌ Failed to archive deal:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to archive deal. Please try again.'
      );
    } finally {
      setArchivingDealId(null);
    }
  };

  // Analyze deal mutation
  const analyzeDealMutation = useMutation({
    mutationFn: async (deal: EmailDeal) => {
      if (!deal.id || !deal.emailContent) {
        throw new Error('Deal ID or email content is missing');
      }
      const response = await apiClient.post('/analyze-email-deal', {
        dealId: deal.id,
        emailContent: deal.emailContent
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-deals'] });
      Alert.alert('Success', 'Property analysis completed successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to analyze email deal');
    }
  });

  // Update property mutation
  const updatePropertyMutation = useMutation({
    mutationFn: async ({ dealId, price, rent }: { dealId: string; price: number; rent: number }) => {
      const deal = deals.find((d: EmailDeal) => d.id === dealId);
      if (!deal || !deal.extractedProperty) {
        throw new Error('Deal or property not found');
      }

      // Update the extractedProperty with the new values
      const updatedExtractedProperty = {
        ...deal.extractedProperty,
        price: price,
        monthlyRent: rent,
      };

      // Update the email deal's extractedProperty
      await apiClient.put(`/email-deals/${dealId}`, {
        extractedProperty: updatedExtractedProperty
      });

      // Then run analysis with the updated property data
      const analysisResponse = await apiClient.post('/analyze-email-deal', {
        dealId: dealId,
        emailContent: deal.emailContent,
      });

      return analysisResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-deals'] });
      setEditingDeal(null);
      setEditValues({});
      Alert.alert('Success', 'Property data has been updated and re-analyzed');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update property');
    }
  });

  const renderRightActions = (deal: EmailDeal) => {
    return (
      <View style={styles.swipeActionsContainer}>
        <TouchableOpacity
          style={[styles.archiveAction, archivingDealId === deal.id && styles.archiveActionDisabled]}
          onPress={() => handleArchiveDeal(deal.id)}
          disabled={archivingDealId === deal.id}
          activeOpacity={0.7}
        >
          <Ionicons name="archive-outline" size={24} color="#FFFFFF" />
          <Text style={styles.archiveActionText}>
            {archivingDealId === deal.id ? 'Archiving...' : 'Archive'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#007AFF';
      case 'analyzed':
        return '#34C759';
      case 'archived':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (isLoading) {
    return <Loading message="Loading email deals..." />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={deals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color="#C7C7CC" />
            <Text style={styles.emptyText}>
              {!isLoaded || !isSignedIn
                ? 'Please Sign In'
                : error && (error as any)?.message?.includes('Network Error') 
                ? 'API Server Not Available' 
                : error && (error as any)?.response?.status === 401
                ? 'Authentication Required'
                : error && (error as any)?.response?.status === 500
                ? 'Server Error'
                : 'No email deals yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!isLoaded || !isSignedIn
                ? 'Sign in to view your email deals'
                : error && (error as any)?.message?.includes('Network Error')
                ? 'Please check your API URL configuration in app.json. The API server may not be running or reachable.'
                : error && (error as any)?.response?.status === 401
                ? 'Please sign in to access your email deals. You may need to sign in again.'
                : error && (error as any)?.response?.status === 500
                ? (error as any)?.response?.data?.error || 'The server encountered an error. Please try again later or contact support if the issue persists.'
                : 'Connect your email to start receiving property deals'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Swipeable
            renderRightActions={() => renderRightActions(item)}
            overshootRight={false}
          >
            <Card style={styles.dealCard}>
              <CardContent>
                {/* Header Section */}
                <View style={styles.dealHeader}>
                  <View style={styles.dealTitleRow}>
                    <Text style={styles.dealSubject} numberOfLines={2}>
                      {item.subject}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: `${getStatusColor(item.status)}20` },
                      ]}
                    >
                      <Text
                        style={[styles.statusText, { color: getStatusColor(item.status) }]}
                      >
                        {item.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.dealSender}>
                    From: {item.sender} • {formatDate(item.receivedDate)}
                  </Text>
                </View>

                {/* Property Details Section */}
                {item.extractedProperty && (
                  <View style={styles.propertySection}>
                    {/* Address */}
                    {item.extractedProperty.address && (
                      <View style={styles.propertyRow}>
                        <Text style={styles.propertyLabel}>Address:</Text>
                        <Text style={styles.propertyValue}>
                          {item.extractedProperty.address}
                        </Text>
                        {item.extractedProperty.city && item.extractedProperty.state && (
                          <Text style={styles.propertySubValue}>
                            {item.extractedProperty.city}, {item.extractedProperty.state}
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Property Details (Bed/Bath/Sqft) */}
                    {(item.extractedProperty.bedrooms || item.extractedProperty.bathrooms || item.extractedProperty.sqft) && (
                      <View style={styles.propertyRow}>
                        <Text style={styles.propertyLabel}>Details:</Text>
                        <Text style={styles.propertyValue}>
                          {item.extractedProperty.bedrooms && `${item.extractedProperty.bedrooms} bd`}
                          {item.extractedProperty.bedrooms && item.extractedProperty.bathrooms && ' | '}
                          {item.extractedProperty.bathrooms && `${item.extractedProperty.bathrooms} ba`}
                          {(item.extractedProperty.bedrooms || item.extractedProperty.bathrooms) && item.extractedProperty.sqft && ' | '}
                          {item.extractedProperty.sqft && `${item.extractedProperty.sqft.toLocaleString()} sqft`}
                        </Text>
                      </View>
                    )}

                    {/* Price and Rent Section */}
                    <View style={styles.priceRentContainer}>
                      {/* Purchase Price */}
                      <View style={styles.priceRentRow}>
                        <Text style={styles.propertyLabel}>Purchase Price:</Text>
                        {editingDeal === item.id ? (
                          <TextInput
                            style={styles.input}
                            placeholder="Enter price"
                            keyboardType="numeric"
                            value={editValues[item.id]?.price ?? item.extractedProperty.price?.toString() ?? ''}
                            onChangeText={(text) => setEditValues(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], price: text }
                            }))}
                          />
                        ) : (
                          <Text style={styles.priceValue}>
                            {item.extractedProperty.price
                              ? `$${item.extractedProperty.price.toLocaleString()}`
                              : 'Not specified'}
                          </Text>
                        )}
                      </View>

                      {/* Monthly Rent */}
                      <View style={styles.priceRentRow}>
                        <Text style={styles.propertyLabel}>Monthly Rent:</Text>
                        {editingDeal === item.id ? (
                          <TextInput
                            style={styles.input}
                            placeholder="Enter rent"
                            keyboardType="numeric"
                            value={editValues[item.id]?.rent ?? item.extractedProperty.monthlyRent?.toString() ?? ''}
                            onChangeText={(text) => setEditValues(prev => ({
                              ...prev,
                              [item.id]: { ...prev[item.id], rent: text }
                            }))}
                          />
                        ) : (
                          <Text style={styles.priceValue}>
                            {item.extractedProperty.monthlyRent
                              ? `$${item.extractedProperty.monthlyRent.toLocaleString()}`
                              : 'Not specified'}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Property Images */}
                    {item.extractedProperty.imageUrls && item.extractedProperty.imageUrls.length > 0 && (
                      <View style={styles.imagesSection}>
                        <Text style={styles.propertyLabel}>Property Images:</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                          {item.extractedProperty.imageUrls.slice(0, 3).map((imageUrl, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => Linking.openURL(imageUrl)}
                            >
                              <Image
                                source={{ uri: imageUrl }}
                                style={styles.propertyImage}
                                resizeMode="cover"
                              />
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                        {item.extractedProperty.imageUrls.length > 3 && (
                          <Text style={styles.moreText}>
                            +{item.extractedProperty.imageUrls.length - 3} more images
                          </Text>
                        )}
                      </View>
                    )}

                    {/* Source Links */}
                    {item.extractedProperty.sourceLinks && item.extractedProperty.sourceLinks.length > 0 && (
                      <View style={styles.linksSection}>
                        <Text style={styles.propertyLabel}>Source Links:</Text>
                        {item.extractedProperty.sourceLinks.slice(0, 2).map((link, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => Linking.openURL(link.url)}
                            style={styles.linkRow}
                          >
                            <Text style={styles.linkEmoji}>
                              {link.type === 'listing' ? '🏠' :
                               link.type === 'company' ? '🏢' : '🔗'}
                            </Text>
                            <Text style={styles.linkText} numberOfLines={1}>
                              {link.description || new URL(link.url).hostname}
                            </Text>
                          </TouchableOpacity>
                        ))}
                        {item.extractedProperty.sourceLinks.length > 2 && (
                          <Text style={styles.moreText}>
                            +{item.extractedProperty.sourceLinks.length - 2} more links
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                {/* Action Buttons Section */}
                <View style={styles.actionsSection}>
                  {editingDeal === item.id ? (
                    <View style={styles.editActions}>
                      <TouchableOpacity
                        style={styles.saveButton}
                        onPress={() => {
                          const price = editValues[item.id]?.price;
                          const rent = editValues[item.id]?.rent;
                          if (price && rent) {
                            updatePropertyMutation.mutate({
                              dealId: item.id,
                              price: parseFloat(price),
                              rent: parseFloat(rent)
                            });
                          } else {
                            Alert.alert('Error', 'Please enter both price and rent');
                          }
                        }}
                        disabled={updatePropertyMutation.isPending}
                      >
                        {updatePropertyMutation.isPending ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <Ionicons name="save-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.buttonText}>Save</Text>
                          </>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => {
                          setEditingDeal(null);
                          setEditValues({});
                        }}
                      >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.buttonRow}>
                      {item.extractedProperty && (
                        <TouchableOpacity
                          style={styles.editButton}
                          onPress={() => {
                            setEditingDeal(item.id);
                            setEditValues({
                              [item.id]: {
                                price: item.extractedProperty?.price?.toString(),
                                rent: item.extractedProperty?.monthlyRent?.toString()
                              }
                            });
                          }}
                        >
                          <Ionicons name="create-outline" size={16} color="#007AFF" />
                          <Text style={styles.editButtonText}>Edit</Text>
                        </TouchableOpacity>
                      )}

                      {item.extractedProperty && !item.analysis && (
                        <TouchableOpacity
                          style={styles.analyzeButton}
                          onPress={() => analyzeDealMutation.mutate(item)}
                          disabled={analyzeDealMutation.isPending}
                        >
                          {analyzeDealMutation.isPending ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <>
                              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
                              <Text style={styles.buttonText}>Analyze</Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {item.analysis && (
                        <TouchableOpacity
                          style={styles.viewAnalysisButton}
                          onPress={() => {
                            navigation.navigate('Analyze', {
                              dealId: item.id,
                              initialData: item.analysis,
                            });
                          }}
                        >
                          <Ionicons name="analytics" size={16} color="#007AFF" />
                          <Text style={styles.viewAnalysisText}>View Analysis</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          </Swipeable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  listContent: {
    padding: 16,
  },
  dealCard: {
    marginBottom: 12,
  },
  dealHeader: {
    marginBottom: 12,
  },
  dealTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealSubject: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  dealSender: {
    fontSize: 12,
    color: '#8E8E93',
  },
  propertySection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  propertyRow: {
    marginBottom: 12,
  },
  propertyLabel: {
    fontSize: 12,
    color: '#8E8E93',
    fontWeight: '500',
    marginBottom: 4,
  },
  propertyValue: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  propertySubValue: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  priceRentContainer: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  priceRentRow: {
    marginBottom: 8,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginTop: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    marginTop: 4,
  },
  imagesSection: {
    marginBottom: 12,
  },
  imagesScroll: {
    marginTop: 8,
  },
  propertyImage: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginRight: 8,
  },
  moreText: {
    fontSize: 11,
    color: '#8E8E93',
    marginTop: 4,
  },
  linksSection: {
    marginBottom: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  linkEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  linkText: {
    fontSize: 13,
    color: '#007AFF',
    flex: 1,
  },
  actionsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E5EA',
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F2F2F7',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  editButton: {
    backgroundColor: '#F2F2F7',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  analyzeButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  criteriaBadge: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  meetsYes: {
    backgroundColor: '#34C75920',
  },
  meetsNo: {
    backgroundColor: '#FF3B3020',
  },
  criteriaText: {
    fontSize: 13,
    fontWeight: '600',
  },
  viewAnalysisButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#007AFF20',
    gap: 6,
  },
  viewAnalysisText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  swipeActionsContainer: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  archiveAction: {
    backgroundColor: '#8E8E93',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    flex: 1,
    borderRadius: 8,
    marginLeft: 8,
    paddingVertical: 16,
  },
  archiveActionDisabled: {
    opacity: 0.6,
  },
  archiveActionText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});
