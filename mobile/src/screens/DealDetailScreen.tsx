import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Linking,
  TouchableOpacity,
} from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
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
  const [showFullEmail, setShowFullEmail] = React.useState(false);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#007AFF';
      case 'reviewed':
        return '#FF9500';
      case 'analyzed':
        return '#34C759';
      case 'archived':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getAIScoreBadgeColor = (category: string) => {
    switch (category) {
      case 'excellent':
        return '#34C759';
      case 'good':
        return '#007AFF';
      case 'fair':
        return '#FF9500';
      default:
        return '#FF3B30';
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Card */}
      <Card style={styles.headerCard}>
        <CardHeader>
          <Text style={styles.title}>{deal.subject}</Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(deal.status)}20` }]}>
            <Text style={[styles.statusText, { color: getStatusColor(deal.status) }]}>
              {deal.status.toUpperCase()}
            </Text>
          </View>
        </CardHeader>
        <CardContent>
          <View style={styles.metaRow}>
            <Ionicons name="person-outline" size={16} color="#8E8E93" />
            <Text style={styles.metaText}>{deal.sender}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color="#8E8E93" />
            <Text style={styles.metaText}>
              {new Date(deal.receivedDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </Text>
          </View>
        </CardContent>
      </Card>

      {/* Property Details Card */}
      {deal.extractedProperty && (
        <Card style={styles.propertyCard}>
          <CardHeader>
            <Text style={styles.sectionTitle}>Property Details</Text>
          </CardHeader>
          <CardContent>
            {/* Address */}
            {deal.extractedProperty.address && (
              <View style={styles.propertySection}>
                <Text style={styles.label}>Address</Text>
                <Text style={styles.propertyValue}>{deal.extractedProperty.address}</Text>
                {deal.extractedProperty.city && deal.extractedProperty.state && (
                  <Text style={styles.propertySubValue}>
                    {deal.extractedProperty.city}, {deal.extractedProperty.state}
                  </Text>
                )}
              </View>
            )}

            {/* Property Specs */}
            {(deal.extractedProperty.bedrooms || deal.extractedProperty.bathrooms || deal.extractedProperty.sqft) && (
              <View style={styles.propertySection}>
                <Text style={styles.label}>Specifications</Text>
                <View style={styles.specsRow}>
                  {deal.extractedProperty.bedrooms && (
                    <View style={styles.specItem}>
                      <Ionicons name="bed-outline" size={20} color="#007AFF" />
                      <Text style={styles.specText}>{deal.extractedProperty.bedrooms} Beds</Text>
                    </View>
                  )}
                  {deal.extractedProperty.bathrooms && (
                    <View style={styles.specItem}>
                      <Ionicons name="water-outline" size={20} color="#007AFF" />
                      <Text style={styles.specText}>{deal.extractedProperty.bathrooms} Baths</Text>
                    </View>
                  )}
                  {deal.extractedProperty.sqft && (
                    <View style={styles.specItem}>
                      <Ionicons name="resize-outline" size={20} color="#007AFF" />
                      <Text style={styles.specText}>{deal.extractedProperty.sqft.toLocaleString()} sqft</Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            {/* Financials */}
            <View style={styles.financialsGrid}>
              {deal.extractedProperty.price && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Purchase Price</Text>
                  <Text style={styles.financialValue}>{formatCurrency(deal.extractedProperty.price)}</Text>
                </View>
              )}
              {deal.extractedProperty.monthlyRent && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Monthly Rent</Text>
                  <Text style={styles.financialValue}>{formatCurrency(deal.extractedProperty.monthlyRent)}</Text>
                </View>
              )}
              {deal.extractedProperty.adr && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>ADR (Daily)</Text>
                  <Text style={styles.financialValue}>${deal.extractedProperty.adr}</Text>
                </View>
              )}
              {deal.extractedProperty.occupancyRate && (
                <View style={styles.financialItem}>
                  <Text style={styles.financialLabel}>Occupancy</Text>
                  <Text style={styles.financialValue}>
                    {Math.round(deal.extractedProperty.occupancyRate * 100)}%
                  </Text>
                </View>
              )}
            </View>

            {/* Property Images */}
            {deal.extractedProperty.imageUrls && deal.extractedProperty.imageUrls.length > 0 && (
              <View style={styles.propertySection}>
                <Text style={styles.label}>Property Images</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
                  {deal.extractedProperty.imageUrls.slice(0, 5).map((imageUrl, index) => {
                    const imageScore = deal.extractedProperty?.imageScores?.find(img => img.url === imageUrl);
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => Linking.openURL(imageUrl)}
                        style={styles.imageContainer}
                      >
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.propertyImage}
                          resizeMode="cover"
                        />
                        {imageScore?.aiScore && (
                          <View style={[
                            styles.imageBadge,
                            { backgroundColor: getAIScoreBadgeColor(imageScore.aiCategory || 'poor') }
                          ]}>
                            <Text style={styles.imageBadgeText}>{imageScore.aiScore.toFixed(1)}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                {deal.extractedProperty.imageUrls.length > 5 && (
                  <Text style={styles.moreText}>
                    +{deal.extractedProperty.imageUrls.length - 5} more images
                  </Text>
                )}
              </View>
            )}

            {/* Source Links */}
            {deal.extractedProperty.sourceLinks && deal.extractedProperty.sourceLinks.length > 0 && (
              <View style={styles.propertySection}>
                <Text style={styles.label}>Source Links</Text>
                {deal.extractedProperty.sourceLinks.slice(0, 3).map((link, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => Linking.openURL(link.url)}
                    style={styles.linkRow}
                  >
                    <View style={styles.linkIconContainer}>
                      {link.type === 'listing' && <Text style={styles.linkEmoji}>🏠</Text>}
                      {link.type === 'company' && <Text style={styles.linkEmoji}>🏢</Text>}
                      {(link.type === 'external' || link.type === 'other') && (
                        <Text style={styles.linkEmoji}>🔗</Text>
                      )}
                    </View>
                    <Text style={styles.linkText} numberOfLines={1}>
                      {link.description || new URL(link.url).hostname}
                    </Text>
                    {link.aiScore && (
                      <View style={[
                        styles.linkBadge,
                        { backgroundColor: getAIScoreBadgeColor(link.aiCategory || 'poor') }
                      ]}>
                        <Text style={styles.linkBadgeText}>{link.aiScore.toFixed(1)}</Text>
                      </View>
                    )}
                    <Ionicons name="chevron-forward" size={16} color="#C7C7CC" />
                  </TouchableOpacity>
                ))}
                {deal.extractedProperty.sourceLinks.length > 3 && (
                  <Text style={styles.moreText}>
                    +{deal.extractedProperty.sourceLinks.length - 3} more links
                  </Text>
                )}
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results Card */}
      {deal.analysis && (
        <Card style={styles.analysisCard}>
          <CardHeader>
            <Text style={styles.sectionTitle}>Analysis Results</Text>
            <View style={[
              styles.criteriaBadge,
              { backgroundColor: deal.analysis.meetsCriteria ? '#34C75920' : '#FF3B3020' }
            ]}>
              <Text style={[
                styles.criteriaText,
                { color: deal.analysis.meetsCriteria ? '#34C759' : '#FF3B30' }
              ]}>
                {deal.analysis.meetsCriteria ? 'MEETS CRITERIA' : 'DOES NOT MEET'}
              </Text>
            </View>
          </CardHeader>
          <CardContent>
            {deal.analysis.cashFlow !== undefined && (
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Cash Flow</Text>
                <Text style={[
                  styles.analysisValue,
                  { color: deal.analysis.cashFlow >= 0 ? '#34C759' : '#FF3B30' }
                ]}>
                  {formatCurrency(deal.analysis.cashFlow)}
                </Text>
              </View>
            )}
            {deal.analysis.roi !== undefined && (
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>ROI</Text>
                <Text style={styles.analysisValue}>{deal.analysis.roi.toFixed(2)}%</Text>
              </View>
            )}
            {deal.analysis.capRate !== undefined && (
              <View style={styles.analysisRow}>
                <Text style={styles.analysisLabel}>Cap Rate</Text>
                <Text style={styles.analysisValue}>{deal.analysis.capRate.toFixed(2)}%</Text>
              </View>
            )}
          </CardContent>
        </Card>
      )}

      {/* Email Content Card */}
      <Card style={styles.emailCard}>
        <CardHeader>
          <Text style={styles.sectionTitle}>Email Content</Text>
        </CardHeader>
        <CardContent>
          <Text style={styles.emailContent} numberOfLines={showFullEmail ? undefined : 4}>
            {stripHtml(deal.emailContent)}
          </Text>
          <TouchableOpacity
            onPress={() => setShowFullEmail(!showFullEmail)}
            style={styles.showMoreButton}
          >
            <Text style={styles.showMoreText}>
              {showFullEmail ? 'Show Less' : 'Show More'}
            </Text>
            <Ionicons
              name={showFullEmail ? 'chevron-up' : 'chevron-down'}
              size={16}
              color="#007AFF"
            />
          </TouchableOpacity>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {!deal.analysis && deal.extractedProperty && (
          <Button
            title="Analyze This Deal"
            onPress={() => navigation.navigate('Analyze', { dealId: deal.id })}
            style={styles.actionButton}
          />
        )}
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
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 12,
  },
  propertyCard: {
    marginBottom: 12,
  },
  analysisCard: {
    marginBottom: 12,
  },
  emailCard: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 8,
  },
  propertySection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  propertyValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  propertySubValue: {
    fontSize: 14,
    color: '#8E8E93',
  },
  specsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  specText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginLeft: 6,
  },
  financialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 12,
  },
  financialItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F2F2F7',
    padding: 12,
    borderRadius: 8,
  },
  financialLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  financialValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  imagesScroll: {
    marginTop: 8,
  },
  imageContainer: {
    width: 120,
    height: 120,
    marginRight: 12,
    borderRadius: 8,
    overflow: 'hidden',
  },
  propertyImage: {
    width: '100%',
    height: '100%',
  },
  imageBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
  },
  imageBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  linkIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  linkEmoji: {
    fontSize: 16,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: '#007AFF',
    marginLeft: 12,
  },
  linkBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  linkBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  moreText: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 8,
    fontStyle: 'italic',
  },
  criteriaBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  criteriaText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  analysisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  analysisLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000000',
  },
  analysisValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
  },
  emailContent: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 22,
  },
  showMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 8,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginRight: 4,
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 32,
  },
});
