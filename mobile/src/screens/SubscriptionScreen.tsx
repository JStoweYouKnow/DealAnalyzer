import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { useAuth } from '@clerk/clerk-expo';
import { useApiClient } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import { useSubscriptionStatus } from '../utils/subscription';

interface Plan {
  id: string;
  name: string;
  amount: number;
  features: string[];
}

export default function SubscriptionScreen() {
  const { user } = useAuth();
  const apiClient = useApiClient();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  // Fetch available plans
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ['stripe-plans'],
    queryFn: async () => {
      const response = await apiClient.get('/api/stripe/create-checkout-session');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch subscription status using the utility hook
  const { data: subscriptionStatus, isLoading: isLoadingStatus } = useSubscriptionStatus();

  const plans: Plan[] = plansData?.plans || [];
  const hasSubscription = subscriptionStatus?.hasSubscription === true;
  const currentPlan = subscriptionStatus?.plan;

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to subscribe.');
      return;
    }

    try {
      setLoadingPlan(planId);

      const baseUrl = 'https://comfort-finder-analyzer.vercel.app';
      const response = await apiClient.post('/api/stripe/create-checkout-session', {
        planId,
        successUrl: `${baseUrl}/subscription/success`,
        cancelUrl: `${baseUrl}/subscription/cancel`,
        email: user.emailAddresses[0]?.emailAddress,
      });

      const { url } = response.data;

      if (url) {
        // Open Stripe checkout in browser
        const result = await WebBrowser.openBrowserAsync(url);
        
        if (result.type === 'opened') {
          Alert.alert(
            'Checkout Opened',
            'Complete your purchase in the browser. You will be redirected back to the app after payment.',
          );
        }
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to start checkout. Please try again.',
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {hasSubscription && currentPlan && (
          <Card style={styles.currentPlanCard}>
            <CardHeader>
              <View style={styles.currentPlanHeader}>
                <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                <Text style={styles.currentPlanTitle}>Current Plan</Text>
              </View>
            </CardHeader>
            <CardContent>
              <Text style={styles.currentPlanName}>{currentPlan}</Text>
              <Text style={styles.currentPlanStatus}>
                Status: {subscriptionStatus?.status || 'Active'}
              </Text>
            </CardContent>
          </Card>
        )}

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Choose Your Plan</Text>
            <Text style={styles.cardSubtitle}>
              Select the plan that best fits your needs
            </Text>
          </CardHeader>
          <CardContent>
            {isLoadingPlans ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Loading plans...</Text>
              </View>
            ) : plans.length === 0 ? (
              <Text style={styles.errorText}>No plans available</Text>
            ) : (
              plans.map((plan) => {
                const isCurrentPlan = currentPlan === plan.id;
                const isLoading = loadingPlan === plan.id;

                return (
                  <View key={plan.id} style={styles.planCard}>
                    <View style={styles.planHeader}>
                      <View>
                        <Text style={styles.planName}>{plan.name}</Text>
                        <Text style={styles.planPrice}>
                          ${plan.amount.toFixed(2)}/month
                        </Text>
                      </View>
                      {isCurrentPlan && (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>Current</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.featuresContainer}>
                      {plan.features.map((feature, index) => (
                        <View key={index} style={styles.featureRow}>
                          <Ionicons
                            name="checkmark"
                            size={20}
                            color="#34C759"
                          />
                          <Text style={styles.featureText}>{feature}</Text>
                        </View>
                      ))}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.subscribeButton,
                        isCurrentPlan && styles.subscribeButtonCurrent,
                        isLoading && styles.subscribeButtonLoading,
                      ]}
                      onPress={() => handleSubscribe(plan.id)}
                      disabled={isCurrentPlan || isLoading}
                      activeOpacity={0.7}
                    >
                      {isLoading ? (
                        <>
                          <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                            style={styles.buttonLoader}
                          />
                          <Text style={styles.subscribeButtonText}>
                            Processing...
                          </Text>
                        </>
                      ) : isCurrentPlan ? (
                        <Text style={styles.subscribeButtonText}>
                          Current Plan
                        </Text>
                      ) : (
                        <Text style={styles.subscribeButtonText}>
                          Subscribe
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card style={styles.card}>
          <CardHeader>
            <Text style={styles.cardTitle}>Payment Information</Text>
          </CardHeader>
          <CardContent>
            <View style={styles.infoRow}>
              <Ionicons name="lock-closed" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                All payments are processed securely through Stripe
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Cancel anytime from your account settings
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={20} color="#007AFF" />
              <Text style={styles.infoText}>
                Your subscription will auto-renew unless cancelled
              </Text>
            </View>
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
  currentPlanCard: {
    marginBottom: 16,
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  currentPlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  currentPlanTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  currentPlanStatus: {
    fontSize: 14,
    color: '#8E8E93',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#8E8E93',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
    padding: 16,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '600',
    color: '#007AFF',
  },
  badge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 16,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  subscribeButtonCurrent: {
    backgroundColor: '#E5E5EA',
  },
  subscribeButtonLoading: {
    opacity: 0.7,
  },
  subscribeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonLoader: {
    marginRight: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#8E8E93',
    lineHeight: 20,
  },
});

