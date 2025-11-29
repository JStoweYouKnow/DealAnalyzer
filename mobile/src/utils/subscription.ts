import { useQuery } from '@tanstack/react-query';
import { useApiClient } from '../services/api';

export interface SubscriptionStatus {
  hasSubscription: boolean;
  plan: string | null;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | null;
  currentPeriodEnd?: number;
}

/**
 * Hook to check user's subscription status
 */
export function useSubscriptionStatus() {
  const apiClient = useApiClient();

  return useQuery<SubscriptionStatus>({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/api/stripe/subscription-status');
        return response.data;
      } catch (error: any) {
        console.error('Error fetching subscription status:', error);
        return {
          hasSubscription: false,
          plan: null,
          status: null,
        };
      }
    },
    staleTime: 60000, // Cache for 1 minute
    refetchInterval: 300000, // Refetch every 5 minutes
  });
}

/**
 * Check if user has an active subscription
 */
export function hasActiveSubscription(status: SubscriptionStatus | undefined): boolean {
  if (!status) return false;
  return status.hasSubscription && status.status === 'active';
}

/**
 * Check if user has a specific plan
 */
export function hasPlan(status: SubscriptionStatus | undefined, planId: string): boolean {
  if (!status) return false;
  return status.hasSubscription && status.plan === planId && status.status === 'active';
}

/**
 * Check if user has Pro plan or higher
 */
export function hasProPlan(status: SubscriptionStatus | undefined): boolean {
  if (!status) return false;
  return status.hasSubscription && 
         (status.plan === 'pro' || status.plan === 'enterprise') && 
         status.status === 'active';
}

