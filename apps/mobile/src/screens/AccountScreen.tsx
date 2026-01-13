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
import { emailDealsApi } from '../services/api';
import axios from 'axios';
import { CONFIG } from '../config';
import type { EmailDeal, DealAnalysis } from '@dealanalyzer/types';

const API_BASE_URL = CONFIG.apiUrl || 'https://comfortfinder.projcomfort.com';

export default function AccountScreen() {
  const { userId, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'statistics'>('profile');

  const { data: emailDeals = [] } = useQuery<EmailDeal[]>({
    queryKey: ['email-deals'],
    queryFn: () => emailDealsApi.getAll(() => Promise.resolve(null)),
  });

  const { data: analyses = [] } = useQuery<DealAnalysis[]>({
    queryKey: ['analysis-history'],
    queryFn: async () => {
      const response = await axios.get(`${API_BASE_URL}/api/history`);
      return Array.isArray(response.data) ? response.data : response.data.data || [];
    },
  });

  const totalAnalyses = analyses.length;
  const meetsCriteriaCount = analyses.filter((a) => a.meetsCriteria).length;
  const totalDeals = emailDeals.length;
  const analyzedDeals = emailDeals.filter((d) => d.status === 'analyzed').length;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>My Account</Text>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'profile' && styles.tabActive]}
          onPress={() => setActiveTab('profile')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'profile' && styles.tabTextActive,
            ]}
          >
            Profile
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'statistics' && styles.tabActive]}
          onPress={() => setActiveTab('statistics')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'statistics' && styles.tabTextActive,
            ]}
          >
            Statistics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email:</Text>
            <Text style={styles.infoValue}>
              {user?.primaryEmailAddress?.emailAddress || 'N/A'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>User ID:</Text>
            <Text style={styles.infoValue}>{userId || 'N/A'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account Created:</Text>
            <Text style={styles.infoValue}>
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString()
                : 'N/A'}
            </Text>
          </View>
        </View>
      )}

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalAnalyses}</Text>
              <Text style={styles.statLabel}>Total Analyses</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{meetsCriteriaCount}</Text>
              <Text style={styles.statLabel}>Meets Criteria</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{totalDeals}</Text>
              <Text style={styles.statLabel}>Email Deals</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{analyzedDeals}</Text>
              <Text style={styles.statLabel}>Analyzed</Text>
            </View>
          </View>

          {analyses.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Investment Summary</Text>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Avg Cash Flow:</Text>
                <Text style={styles.metricValue}>
                  {formatCurrency(
                    analyses.reduce((sum, a) => sum + (a.cashFlow || 0), 0) /
                      analyses.length
                  )}
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Avg CoC Return:</Text>
                <Text style={styles.metricValue}>
                  {(
                    (analyses.reduce((sum, a) => sum + (a.cocReturn || 0), 0) /
                      analyses.length) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
              </View>
              <View style={styles.metricRow}>
                <Text style={styles.metricLabel}>Avg Cap Rate:</Text>
                <Text style={styles.metricValue}>
                  {(
                    (analyses.reduce((sum, a) => sum + (a.capRate || 0), 0) /
                      analyses.length) *
                    100
                  ).toFixed(1)}
                  %
                </Text>
              </View>
            </View>
          )}
        </>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 4,
  },
  tabActive: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
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
    marginBottom: 16,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
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
});










