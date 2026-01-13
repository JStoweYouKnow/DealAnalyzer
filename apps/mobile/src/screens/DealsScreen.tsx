import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '@clerk/clerk-expo';
import { useQuery } from '@tanstack/react-query';
import { emailDealsApi } from '../services/api';
import type { EmailDeal } from '@dealanalyzer/types';

export default function DealsScreen() {
  const navigation = useNavigation();
  const { getToken } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'analyzed' | 'archived'>('all');

  const { data: deals = [], isLoading, refetch } = useQuery<EmailDeal[]>({
    queryKey: ['email-deals'],
    queryFn: () => emailDealsApi.getAll(getToken),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const filteredDeals = deals.filter((deal) => {
    const matchesSearch =
      deal.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.sender?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      deal.extractedProperty?.address?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus =
      statusFilter === 'all' || deal.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzed':
        return '#28a745';
      case 'new':
        return '#007bff';
      case 'archived':
        return '#6c757d';
      default:
        return '#6c757d';
    }
  };

  if (isLoading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007bff" />
        <Text style={styles.loadingText}>Loading deals...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter Bar */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search deals..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={styles.filterContent}
      >
        {(['all', 'new', 'analyzed', 'archived'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterButton,
              statusFilter === status && styles.filterButtonActive,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterButtonText,
                statusFilter === status && styles.filterButtonTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Deals List */}
      <ScrollView
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {filteredDeals.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery || statusFilter !== 'all'
                ? 'No deals match your filters'
                : 'No email deals yet'}
            </Text>
          </View>
        ) : (
          filteredDeals.map((deal) => (
            <TouchableOpacity
              key={deal.id}
              style={styles.dealCard}
              onPress={() =>
                (navigation as any).navigate('DealDetail', { dealId: deal.id })
              }
            >
              <View style={styles.dealHeader}>
                <Text style={styles.dealSubject} numberOfLines={2}>
                  {deal.subject || 'No subject'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(deal.status || 'new') },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {deal.status?.toUpperCase() || 'NEW'}
                  </Text>
                </View>
              </View>

              <Text style={styles.dealSender} numberOfLines={1}>
                From: {deal.sender || 'Unknown'}
              </Text>

              {deal.extractedProperty?.address && (
                <Text style={styles.dealAddress} numberOfLines={1}>
                  📍 {deal.extractedProperty.address}
                </Text>
              )}

              {deal.extractedProperty?.price && (
                <Text style={styles.dealPrice}>
                  {formatCurrency(deal.extractedProperty.price)}
                </Text>
              )}

              {deal.extractedProperty?.monthlyRent && (
                <Text style={styles.dealRent}>
                  Rent: {formatCurrency(deal.extractedProperty.monthlyRent)}
                </Text>
              )}

              <Text style={styles.dealDate}>
                {formatDate(deal.receivedDate)}
              </Text>

              {deal.analysis && (
                <View style={styles.analysisBadge}>
                  <Text style={styles.analysisText}>
                    ✓ Analyzed -{' '}
                    {deal.analysis.meetsCriteria ? 'Meets Criteria' : 'Does Not Meet'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  searchBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
  },
  filterBar: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#007bff',
  },
  filterButtonText: {
    color: '#333',
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  list: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  dealCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  dealSubject: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  dealSender: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  dealAddress: {
    fontSize: 14,
    color: '#333',
    marginBottom: 4,
  },
  dealPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    marginTop: 8,
  },
  dealRent: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  dealDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  analysisBadge: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e8f5e9',
    borderRadius: 4,
  },
  analysisText: {
    fontSize: 12,
    color: '#2e7d32',
    fontWeight: '500',
  },
});










