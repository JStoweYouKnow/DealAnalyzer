import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
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
  const { isSignedIn, isLoaded } = useAuth();
  const apiClient = useApiClient();

  const { data: deals = [], isLoading, refetch, error } = useQuery<EmailDeal[]>({
    queryKey: ['email-deals', isSignedIn],
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
        // Check if it's a network error
        if (err.message?.includes('Network Error') || err.code === 'ERR_NETWORK') {
          console.warn('API server is not reachable. Please check your API URL configuration.');
        }
        // Check if it's an auth error
        if (err.response?.status === 401) {
          console.warn('⚠️ Authentication failed - user may need to sign in again');
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
                : 'No email deals yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {!isLoaded || !isSignedIn
                ? 'Sign in to view your email deals'
                : error && (error as any)?.message?.includes('Network Error')
                ? 'Please check your API URL configuration in app.json. The API server may not be running or reachable.'
                : error && (error as any)?.response?.status === 401
                ? 'Please sign in to access your email deals. You may need to sign in again.'
                : 'Connect your email to start receiving property deals'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => navigation.navigate('DealDetail', { dealId: item.id })}
          >
            <Card style={styles.dealCard}>
              <CardContent>
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
                  <Text style={styles.dealSender}>{item.sender}</Text>
                </View>

                <View style={styles.dealFooter}>
                  <View style={styles.dealDate}>
                    <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
                    <Text style={styles.dealDateText}>
                      {formatDate(item.receivedDate)}
                    </Text>
                  </View>
                  {item.propertyId && (
                    <View style={styles.analyzedBadge}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <Text style={styles.analyzedText}>Analyzed</Text>
                    </View>
                  )}
                </View>
              </CardContent>
            </Card>
          </TouchableOpacity>
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
    fontSize: 14,
    color: '#8E8E93',
  },
  dealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dealDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dealDateText: {
    fontSize: 12,
    color: '#8E8E93',
    marginLeft: 4,
  },
  analyzedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzedText: {
    fontSize: 12,
    color: '#34C759',
    marginLeft: 4,
    fontWeight: '600',
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
});
