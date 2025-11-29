import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Input } from '../components/ui/Input';

export default function HelpSupportScreen() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({
    subject: '',
    message: '',
  });

  const faqSections = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      questions: [
        {
          q: 'How do I connect my Gmail account?',
          a: 'Go to Email Settings and click "Connect Gmail Account". You will be redirected to authorize DealAnalyzer to access your emails. Once connected, the app will automatically scan for property deals.',
        },
        {
          q: 'How does automatic deal analysis work?',
          a: 'When you receive emails containing property information, DealAnalyzer automatically extracts key details (price, location, rent, etc.) and performs a financial analysis to determine if the deal meets your investment criteria.',
        },
        {
          q: 'What investment criteria can I set?',
          a: 'You can set minimum cash-on-cash return, cap rate, monthly cash flow, and other parameters in the Preferences screen. These criteria are used to automatically evaluate deals.',
        },
      ],
    },
    {
      id: 'analysis',
      title: 'Property Analysis',
      questions: [
        {
          q: 'How accurate is the property analysis?',
          a: 'Our analysis uses real-time market data from multiple sources including RentCast, Census, and Attom Data. However, you should always verify key details and consult with professionals before making investment decisions.',
        },
        {
          q: 'Can I compare multiple properties?',
          a: 'Yes! Use the Comparison feature to analyze and compare multiple properties side-by-side. This helps you identify the best investment opportunities.',
        },
        {
          q: 'What metrics are included in the analysis?',
          a: 'Each analysis includes cash-on-cash return, cap rate, net operating income, cash flow, price-to-rent ratio, and market score. We also provide neighborhood demographics and market trends.',
        },
      ],
    },
    {
      id: 'market-data',
      title: 'Market Intelligence',
      questions: [
        {
          q: 'How often is market data updated?',
          a: 'Market data is updated in real-time from our data providers. The Market Intelligence screen shows current market trends, median prices, rents, and cap rates for your area.',
        },
        {
          q: 'Can I search for specific ZIP codes?',
          a: 'Yes! Use the Neighborhood Intelligence feature to search for detailed market data by ZIP code, including property mix, demographics, and price trends.',
        },
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  const handleSendMessage = () => {
    if (!contactForm.subject || !contactForm.message) {
      Alert.alert('Error', 'Please fill in both subject and message fields.');
      return;
    }
    // TODO: Send support message to backend
    Alert.alert('Success', 'Your message has been sent! We will get back to you within 24 hours.');
    setContactForm({ subject: '', message: '' });
  };

  const openEmail = () => {
    const email = 'support@dealanalyzer.com';
    Linking.openURL(`mailto:${email}?subject=Support Request`);
  };

  const openPhone = () => {
    const phone = '1-800-DEAL-ANALYZER';
    Linking.openURL(`tel:${phone}`);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Contact Support</Text>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={openEmail}
              activeOpacity={0.7}
            >
              <Ionicons name="mail" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Email Support</Text>
                <Text style={styles.contactValue}>support@dealanalyzer.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={openPhone}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Phone Support</Text>
                <Text style={styles.contactValue}>1-800-DEAL-ANALYZER</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Send us a message</Text>
            <View style={styles.inputContainer}>
              <Input
                label="Subject"
                value={contactForm.subject}
                onChangeText={(text) => setContactForm({ ...contactForm, subject: text })}
                placeholder="What can we help you with?"
              />
            </View>
            <View style={styles.inputContainer}>
              <Input
                label="Message"
                value={contactForm.message}
                onChangeText={(text) => setContactForm({ ...contactForm, message: text })}
                placeholder="Describe your issue or question..."
                multiline
                style={styles.multilineInput}
              />
            </View>
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}
              activeOpacity={0.7}
            >
              <Text style={styles.sendButtonText}>Send Message</Text>
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Frequently Asked Questions</Text>
          </CardHeader>
          <CardContent>
            {faqSections.map((section) => (
              <View key={section.id} style={styles.faqSection}>
                <TouchableOpacity
                  style={styles.faqSectionHeader}
                  onPress={() => toggleSection(section.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.faqSectionTitle}>{section.title}</Text>
                  <Ionicons
                    name={expandedSection === section.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#007AFF"
                  />
                </TouchableOpacity>

                {expandedSection === section.id && (
                  <View style={styles.faqQuestions}>
                    {section.questions.map((item, index) => (
                      <View key={index} style={styles.faqItem}>
                        <Text style={styles.faqQuestion}>{item.q}</Text>
                        <Text style={styles.faqAnswer}>{item.a}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Resources</Text>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => {
                Linking.openURL('https://dealanalyzer.com/docs');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="document-text" size={24} color="#007AFF" />
              <Text style={styles.resourceText}>Documentation</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => {
                Linking.openURL('https://dealanalyzer.com/video-tutorials');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="videocam" size={24} color="#007AFF" />
              <Text style={styles.resourceText}>Video Tutorials</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resourceButton}
              onPress={() => {
                Linking.openURL('https://dealanalyzer.com/blog');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="newspaper" size={24} color="#007AFF" />
              <Text style={styles.resourceText}>Blog & Tips</Text>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </CardContent>
        </Card>
      </View>
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
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  contactInfo: {
    flex: 1,
    marginLeft: 12,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  contactValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  inputContainer: {
    marginBottom: 16,
  },
  multilineInput: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  faqSection: {
    marginBottom: 16,
  },
  faqSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  faqSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  faqQuestions: {
    paddingTop: 12,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
  resourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  resourceText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    marginLeft: 12,
  },
});

