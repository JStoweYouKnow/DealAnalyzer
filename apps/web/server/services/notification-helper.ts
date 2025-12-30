import { storage } from '../storage';

/**
 * Send a notification to a user if notifications are enabled for the event type
 * @param userId - The user ID to send the notification to
 * @param eventType - The type of notification event
 * @param data - Additional data for the notification
 */
export async function sendNotificationIfEnabled(
  userId: string,
  eventType: 'analysis_complete' | 'criteria_match' | 'new_deal' | string,
  data: Record<string, any>
): Promise<void> {
  try {
    // TODO: Implement actual notification logic
    // For now, this is a stub to prevent build errors
    // In the future, this should:
    // 1. Check user notification preferences
    // 2. Send email/push notification based on preferences
    // 3. Log notification events
    console.log(`[Notification] ${eventType} for user ${userId}:`, data);
  } catch (error) {
    console.error('Failed to send notification:', error);
    // Don't throw - notifications should not break the main flow
  }
}

// Re-export storage for backward compatibility
export { storage };
