import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export default function TermsPrivacyScreen() {
  const sections = [
    {
      id: 'terms',
      title: 'Terms of Service',
      content: `Last Updated: ${new Date().toLocaleDateString()}

Welcome to DealAnalyzer. By using our service, you agree to the following terms:

1. SERVICE DESCRIPTION
DealAnalyzer provides automated property deal analysis and market intelligence tools. We help you analyze real estate investment opportunities by processing email deals and providing financial analysis.

2. USER ACCOUNT
You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account.

3. ACCEPTABLE USE
You agree not to:
- Use the service for any illegal purpose
- Attempt to gain unauthorized access to our systems
- Interfere with or disrupt the service
- Use automated systems to access the service without permission

4. DATA AND PRIVACY
We collect and process data as described in our Privacy Policy. By using the service, you consent to our data practices.

5. INTELLECTUAL PROPERTY
All content, features, and functionality of the service are owned by DealAnalyzer and are protected by copyright, trademark, and other laws.

6. DISCLAIMER
The analysis provided is for informational purposes only and should not be considered as financial, legal, or investment advice. Always consult with qualified professionals before making investment decisions.

7. LIMITATION OF LIABILITY
DealAnalyzer shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.

8. MODIFICATIONS
We reserve the right to modify these terms at any time. Continued use of the service after changes constitutes acceptance of the new terms.`,
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: `Last Updated: ${new Date().toLocaleDateString()}

DealAnalyzer is committed to protecting your privacy. This policy explains how we collect, use, and protect your information.

1. INFORMATION WE COLLECT
- Account Information: Email address, name, and authentication credentials
- Email Content: Property deal emails you choose to analyze
- Usage Data: How you interact with the service
- Device Information: Device type, operating system, and app version

2. HOW WE USE YOUR INFORMATION
- To provide and improve our services
- To analyze property deals from your emails
- To send you notifications and updates
- To respond to your support requests
- To detect and prevent fraud or abuse

3. DATA STORAGE AND SECURITY
- We use industry-standard encryption to protect your data
- Your email credentials are securely stored using OAuth
- We retain your data only as long as necessary to provide the service

4. SHARING YOUR INFORMATION
We do not sell your personal information. We may share data with:
- Service providers who help us operate the service
- Legal authorities when required by law
- Business partners with your explicit consent

5. YOUR RIGHTS
You have the right to:
- Access your personal data
- Correct inaccurate information
- Delete your account and data
- Opt-out of marketing communications
- Export your data

6. COOKIES AND TRACKING
We use cookies and similar technologies to improve your experience and analyze service usage.

7. CHILDREN'S PRIVACY
Our service is not intended for users under 18 years of age. We do not knowingly collect information from children.

8. INTERNATIONAL USERS
If you are using the service from outside the United States, your data may be transferred to and processed in the United States.

9. CHANGES TO THIS POLICY
We may update this privacy policy from time to time. We will notify you of significant changes via email or in-app notification.`,
    },
    {
      id: 'gdpr',
      title: 'GDPR Compliance',
      content: `DealAnalyzer complies with the General Data Protection Regulation (GDPR) for users in the European Union.

Your Rights Under GDPR:
- Right to Access: Request a copy of your personal data
- Right to Rectification: Correct inaccurate or incomplete data
- Right to Erasure: Request deletion of your data
- Right to Restrict Processing: Limit how we use your data
- Right to Data Portability: Receive your data in a structured format
- Right to Object: Object to certain types of data processing

To exercise these rights, contact us at privacy@dealanalyzer.com.`,
    },
    {
      id: 'cookies',
      title: 'Cookie Policy',
      content: `We use cookies and similar technologies to enhance your experience:

Essential Cookies: Required for the service to function
- Authentication cookies
- Session management
- Security features

Analytics Cookies: Help us understand how you use the service
- Usage statistics
- Performance metrics
- Error tracking

You can control cookies through your device settings, but disabling essential cookies may affect service functionality.`,
    },
  ];

  const [activeSection, setActiveSection] = React.useState<string>('terms');

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Legal Documents</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.tabContainer}>
              {sections.map((section) => (
                <TouchableOpacity
                  key={section.id}
                  style={[
                    styles.tab,
                    activeSection === section.id && styles.tabActive,
                  ]}
                  onPress={() => setActiveSection(section.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.tabText,
                      activeSection === section.id && styles.tabTextActive,
                    ]}
                  >
                    {section.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.contentContainer}>
              <Text style={styles.contentText}>
                {sections.find((s) => s.id === activeSection)?.content}
              </Text>
            </View>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Contact Legal</Text>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:legal@dealanalyzer.com')}
              activeOpacity={0.7}
            >
              <Ionicons name="mail" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Legal Inquiries</Text>
                <Text style={styles.contactValue}>legal@dealanalyzer.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => Linking.openURL('mailto:privacy@dealanalyzer.com')}
              activeOpacity={0.7}
            >
              <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
              <View style={styles.contactInfo}>
                <Text style={styles.contactLabel}>Privacy Inquiries</Text>
                <Text style={styles.contactValue}>privacy@dealanalyzer.com</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#C7C7CC" />
            </TouchableOpacity>
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Data Management</Text>
          </CardHeader>
          <CardContent>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                // TODO: Implement data export
                alert('Data export feature coming soon!');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="download" size={24} color="#007AFF" />
              <Text style={styles.actionButtonText}>Export My Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.actionButtonDanger]}
              onPress={() => {
                // TODO: Implement account deletion
                alert('Account deletion feature coming soon!');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="trash" size={24} color="#FF3B30" />
              <Text style={[styles.actionButtonText, styles.actionButtonTextDanger]}>
                Delete My Account
              </Text>
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
  tabContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F2F7',
    marginRight: 8,
    marginBottom: 8,
  },
  tabActive: {
    backgroundColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contentText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 22,
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
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#007AFF',
    marginBottom: 12,
    gap: 12,
  },
  actionButtonDanger: {
    borderColor: '#FF3B30',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  actionButtonTextDanger: {
    color: '#FF3B30',
  },
});

