import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export default function SubscriptionScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Subscription</Text>
      <Text style={styles.subtitle}>Manage your subscription plan</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Plan</Text>
        <Text style={styles.planName}>Free Tier</Text>
        <Text style={styles.planDescription}>
          You are currently on the free tier. Upgrade to unlock more features.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Plans</Text>
        <Text style={styles.comingSoon}>Subscription management coming soon</Text>
      </View>
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
    marginBottom: 8,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
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
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  planDescription: {
    fontSize: 14,
    color: '#666',
  },
  comingSoon: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});










