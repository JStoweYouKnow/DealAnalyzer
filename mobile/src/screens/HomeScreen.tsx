import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Ionicons } from '@expo/vector-icons';
import InfoTooltip from '../components/InfoTooltip';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

function getFeatureInfo(featureId: string): string {
  switch (featureId) {
    case 'analyze':
      return "Upload property details via PDF, paste email content, or enter manually. DealAnalyzer will calculate key metrics like cash-on-cash return, cap rate, and ROI to help you make informed investment decisions.";
    case 'deals':
      return "View all property deals received via email. Deals are automatically extracted from your inbox and can be analyzed with one tap. Connect your Gmail account or set up email forwarding to start receiving deals.";
    case 'market':
      return "Get comprehensive market intelligence including comparable sales, market trends, and property valuations. This helps you understand the local market and make better pricing decisions.";
    case 'search':
      return "Search for properties using natural language queries. Find properties matching your investment criteria, location preferences, and budget constraints.";
    default:
      return '';
  }
}

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();

  const features = [
    {
      id: 'analyze',
      title: 'Analyze Property',
      description: 'Upload or paste property details for instant analysis',
      icon: 'calculator',
      color: '#007AFF',
      onPress: () => navigation.navigate('Analyze'),
    },
    {
      id: 'deals',
      title: 'Email Deals',
      description: 'View and analyze deals from your inbox',
      icon: 'mail',
      color: '#34C759',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Deals' }),
    },
    {
      id: 'market',
      title: 'Market Intelligence',
      description: 'Get insights on market trends and comps',
      icon: 'analytics',
      color: '#FF9500',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Market' }),
    },
    {
      id: 'search',
      title: 'Search Properties',
      description: 'Find properties matching your criteria',
      icon: 'search',
      color: '#5856D6',
      onPress: () => navigation.navigate('MainTabs', { screen: 'Search' }),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>Welcome to DealAnalyzer</Text>
            <InfoTooltip
              title="About DealAnalyzer"
              content={[
                "DealAnalyzer helps you analyze real estate investment opportunities on the go. Use the features below to:",
                "• Analyze properties from emails, PDFs, or manual entry",
                "• View and manage deals from your inbox",
                "• Get market intelligence and comparable sales",
                "• Search for properties matching your criteria",
              ]}
            />
          </View>
          <Text style={styles.subtitle}>
            Analyze real estate investments on the go
          </Text>
        </View>

        <View style={styles.featuresContainer}>
          {features.map((feature) => (
            <TouchableOpacity
              key={feature.id}
              style={[styles.featureCard, { borderLeftColor: feature.color }]}
              onPress={feature.onPress}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${feature.color}15` }]}>
                <Ionicons name={feature.icon as any} size={32} color={feature.color} />
              </View>
              <View style={styles.featureContent}>
                <View style={styles.featureTitleRow}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <InfoTooltip
                    title={feature.title}
                    content={getFeatureInfo(feature.id)}
                    iconSize={18}
                    iconColor={feature.color}
                  />
                </View>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statValue}>0</Text>
              <InfoTooltip
                title="Properties Analyzed"
                content="This shows the total number of properties you've analyzed using DealAnalyzer. Each analysis includes financial metrics, ROI calculations, and investment recommendations."
                iconSize={16}
                iconColor="#007AFF"
              />
            </View>
            <Text style={styles.statLabel}>Properties Analyzed</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statValue}>0</Text>
              <InfoTooltip
                title="Email Deals"
                content="This shows the number of property deals received via email. Connect your Gmail or set up email forwarding to automatically receive and analyze property deals from your inbox."
                iconSize={16}
                iconColor="#007AFF"
              />
            </View>
            <Text style={styles.statLabel}>Email Deals</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  featuresContainer: {
    padding: 16,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
    flex: 1,
  },
  featureDescription: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
});
