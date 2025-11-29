import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type AnalyzeScreenRouteProp = RouteProp<RootStackParamList, 'Analyze'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function AnalyzeScreen() {
  const route = useRoute<AnalyzeScreenRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const analysisData = route.params?.initialData;

  if (!analysisData) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No analysis data available</Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
      </View>
    );
  }

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
                {analysisData.property?.address || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Purchase Price:</Text>
              <Text style={styles.infoValue}>
                ${analysisData.property?.purchasePrice?.toLocaleString() || 'N/A'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Monthly Rent:</Text>
              <Text style={styles.infoValue}>
                ${analysisData.property?.monthlyRent?.toLocaleString() || 'N/A'}
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
                  analysisData.cashFlow >= 0 ? styles.positive : styles.negative,
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
});
