import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';

export default function HelpSupportScreen() {
  const handleContactSupport = () => {
    Linking.openURL('mailto:support@dealanalyzer.com');
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Help & Support</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        
        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I analyze a property?</Text>
          <Text style={styles.faqAnswer}>
            Go to the Home screen and either upload a property file (PDF/image) or enter a property
            listing URL. Fill in the rental metrics and expenses, then tap "Analyze Property".
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How do I connect my Gmail?</Text>
          <Text style={styles.faqAnswer}>
            Go to Email Settings and tap "Connect Gmail". You'll be redirected to authorize the
            app to access your Gmail account.
          </Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>What file formats are supported?</Text>
          <Text style={styles.faqAnswer}>
            The app supports PDF files and images (JPEG, PNG) containing property listing information.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <Text style={styles.supportText}>
          Need help? Contact our support team for assistance.
        </Text>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
          <Text style={styles.contactButtonText}>Email Support</Text>
        </TouchableOpacity>
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
    marginBottom: 16,
    color: '#333',
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  supportText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  contactButton: {
    backgroundColor: '#007bff',
    paddingVertical: 12,
    borderRadius: 4,
    alignItems: 'center',
  },
  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});










