import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

export default function TermsPrivacyScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms & Privacy</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Terms of Service</Text>
        <Text style={styles.content}>
          By using this app, you agree to our Terms of Service. The app is provided "as is"
          without warranties of any kind. We are not responsible for investment decisions made
          based on analysis results.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy Policy</Text>
        <Text style={styles.content}>
          We respect your privacy. Property data and analysis results are stored securely. We do
          not share your personal information with third parties without your consent. Gmail
          integration requires access to your email account to detect property listings.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Usage</Text>
        <Text style={styles.content}>
          Property data and analysis results are stored on our servers to provide you with
          historical access and comparison features. You can request deletion of your data at any
          time.
        </Text>
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
    marginBottom: 24,
    color: '#333',
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
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});










