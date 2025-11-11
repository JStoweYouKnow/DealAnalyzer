import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import api from '../services/api';
import InfoTooltip from '../components/InfoTooltip';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getStatusInfo(status: string): string {
  switch (status) {
    case 'new':
      return "This deal has been received but not yet analyzed. Tap on the deal to view details and run an analysis with your investment criteria.";
    case 'analyzing':
      return "This deal is currently being analyzed. Property data is being extracted and financial metrics are being calculated. Please wait for the analysis to complete.";
    case 'analyzed':
      return "This deal has been fully analyzed. View the analysis results to see ROI, cash flow, and other key investment metrics.";
    default:
      return "Deal status information.";
  }
}

interface EmailDeal {
  id: string;
  subject: string;
  sender: string;
  receivedDate: string;
  status: 'new' | 'analyzing' | 'analyzed';
  extractedProperty?: {
    address?: string;
    city?: string;
    state?: string;
    price?: number;
  };
}

export default function DealsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [deals, setDeals] = useState<EmailDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeals = async (isRefresh: boolean = false) => {
    // Clear error before retrying
    setError(null);
    
    try {
      const response = await api.getEmailDeals();
      setDeals(response.data || []);
    } catch (err: any) {
      console.error('Error fetching deals:', err);
      
      // Extract user-friendly error message
      const errorMessage = 
        err.response?.data?.message ||
        err.message ||
        'Failed to load deals. Please try again.';
      setError(errorMessage);
    } finally {
      // Only update loading state if this was the initial load
      if (!isRefresh) {
        setLoading(false);
      }
      // Only update refreshing state if this was a pull-to-refresh
      if (isRefresh) {
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    fetchDeals(false);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeals(true);
  };

  const handleRetry = () => {
    setLoading(true);
    fetchDeals(false);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) {
      return '—';
    }
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return '—';
    }
    return date.toLocaleDateString();
  };

  const renderDealItem = ({ item }: { item: EmailDeal }) => {
    const statusColor = {
      new: '#FF9500',
      analyzing: '#007AFF',
      analyzed: '#34C759',
    }[item.status];

    return (
      <TouchableOpacity
        style={styles.dealCard}
        onPress={() => navigation.navigate('DealDetail', { dealId: item.id })}
      >
        <View style={styles.dealHeader}>
          <View style={styles.statusContainer}>
            <View style={[styles.statusBadge, { backgroundColor: `${statusColor}15` }]}>
              <Text style={[styles.statusText, { color: statusColor }]}>
                {item.status.toUpperCase()}
              </Text>
            </View>
            <InfoTooltip
              title={`Deal Status: ${item.status.toUpperCase()}`}
              content={getStatusInfo(item.status)}
              iconSize={14}
              iconColor={statusColor}
            />
          </View>
          <Text style={styles.dateText}>
            {formatDate(item.receivedDate)}
          </Text>
        </View>

        <Text style={styles.subjectText} numberOfLines={2}>
          {item.subject}
        </Text>

        {item.extractedProperty?.address && (
          <View style={styles.propertyInfo}>
            <Ionicons name="location" size={16} color="#8E8E93" />
            <Text style={styles.addressText} numberOfLines={1}>
              {[
                item.extractedProperty.address,
                item.extractedProperty.city,
                item.extractedProperty.state,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          </View>
        )}

        {item.extractedProperty?.price && (
          <Text style={styles.priceText}>
            ${item.extractedProperty.price.toLocaleString()}
          </Text>
        )}

        <View style={styles.senderInfo}>
          <Ionicons name="mail" size={14} color="#8E8E93" />
          <Text style={styles.senderText}>{item.sender}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.infoHeader}>
        <View style={styles.infoHeaderRow}>
          <Text style={styles.infoHeaderText}>Email Deals</Text>
          <InfoTooltip
            title="Email Deals"
            content={[
              "This screen shows all property deals received via email. Deals are automatically extracted from your inbox when you connect your Gmail account or set up email forwarding.",
              "• Pull down to refresh and load new deals",
              "• Tap on a deal to view details and analyze the property",
              "• Deal statuses: NEW (not analyzed), ANALYZING (in progress), ANALYZED (complete)",
            ]}
            iconSize={20}
          />
        </View>
        <Text style={styles.infoSubtext}>
          Pull down to refresh • Tap deals to analyze
        </Text>
      </View>
      <FlatList
        data={deals}
        renderItem={renderDealItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          error ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="alert-circle" size={64} color="#FF3B30" />
              <Text style={styles.emptyTitle}>Error Loading Deals</Text>
              <Text style={styles.emptyText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={handleRetry}
                disabled={loading}
              >
                <Text style={styles.retryButtonText}>
                  {loading ? 'Retrying...' : 'Retry'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="mail-outline" size={64} color="#C7C7CC" />
              <Text style={styles.emptyTitle}>No Deals Yet</Text>
              <Text style={styles.emptyText}>
                Connect your Gmail or set up email forwarding to start receiving
                property deals
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoHeader: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  infoHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  infoHeaderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  infoSubtext: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
  },
  dealCard: {
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
  dealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  subjectText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  propertyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  addressText: {
    fontSize: 14,
    color: '#8E8E93',
    flex: 1,
  },
  priceText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 8,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  senderText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
