import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { RootStackParamList } from '../types';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { useApiClient } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { EmailDeal } from '../types';

type DealDetailRouteProp = RouteProp<RootStackParamList, 'DealDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function to strip HTML tags from email content
function stripHtml(html: string): string {
  if (!html) return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Remove excessive whitespace
  text = text.replace(/\s+/g, ' ').trim();

  return text;
}

export default function DealDetailScreen() {
  const route = useRoute<DealDetailRouteProp>();
  const navigation = useNavigation<NavigationProp>();
  const { dealId } = route.params;
  const apiClient = useApiClient();

  const { data: deal, isLoading } = useQuery<EmailDeal>({
    queryKey: ['email-deal', dealId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/email-deals/${dealId}`);
        return response.data || response;
      } catch (err: any) {
        console.error('Failed to fetch deal:', err);
        throw err; // Re-throw to show error state
      }
    },
    retry: false,
  });

  if (isLoading) {
    return <Loading message="Loading deal details..." />;
  }

  if (!deal) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Deal not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card>
        <CardHeader>
          <Text style={styles.title}>{deal.subject}</Text>
        </CardHeader>
        <CardContent>
          <View style={styles.section}>
            <Text style={styles.label}>From:</Text>
            <Text style={styles.value}>{deal.sender}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Received:</Text>
            <Text style={styles.value}>
              {new Date(deal.receivedDate).toLocaleString()}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Status:</Text>
            <Text style={styles.value}>{deal.status}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Email Content:</Text>
            <Text style={styles.emailContent}>{stripHtml(deal.emailContent)}</Text>
          </View>

          <Button
            title="Analyze This Deal"
            onPress={() => navigation.navigate('Analyze', { dealId: deal.id })}
            style={styles.analyzeButton}
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
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: '#000000',
  },
  emailContent: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
    marginTop: 8,
  },
  analyzeButton: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 32,
  },
});
