import { sendNotificationEmail } from './notification-email-service';

async function getConvexClient() {
  const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!CONVEX_URL) {
    return null;
  }

  try {
    const { ConvexHttpClient } = await import('convex/browser');
    return new ConvexHttpClient(CONVEX_URL);
  } catch (error) {
    console.error('Failed to initialize Convex client:', error);
    return null;
  }
}

async function getConvexApi() {
  try {
    const apiModule = await import('../../convex/_generated/api');
    return apiModule.api;
  } catch (error) {
    console.error('Failed to import Convex API:', error);
    return null;
  }
}

async function getUserPreferences(userId: string) {
  const client = await getConvexClient();
  const api = await getConvexApi();

  if (!client || !api) {
    return null;
  }

  try {
    return await client.query(api.userPreferences.getPreferences, { userId });
  } catch (error) {
    console.error('Failed to fetch user preferences:', error);
    return null;
  }
}

/**
 * Check if notification should be sent based on user preferences and frequency
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: 'new_deal' | 'analysis_complete' | 'criteria_match' | 'weekly_summary'
): Promise<{ shouldSend: boolean; preferences: any | null }> {
  // Disable email notifications if feature flag is set to false or not configured
  const enableEmailNotifications = process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false';
  
  if (!userId || !process.env.RESEND_API_KEY || !enableEmailNotifications) {
    if (!enableEmailNotifications) {
      console.log('Email notifications are disabled (ENABLE_EMAIL_NOTIFICATIONS=false)');
    }
    return { shouldSend: false, preferences: null };
  }

  const preferences = await getUserPreferences(userId);
  
  if (!preferences) {
    // Default behavior if preferences not found
    if (notificationType === 'criteria_match') {
      return { shouldSend: true, preferences: { frequency: 'immediate' } };
    }
    return { shouldSend: false, preferences: null };
  }

  // Check if notification type is enabled
  let isEnabled = false;
  switch (notificationType) {
    case 'new_deal':
      isEnabled = preferences.notifyOnNewDeals ?? false;
      break;
    case 'analysis_complete':
      isEnabled = preferences.notifyOnAnalysisComplete ?? false;
      break;
    case 'criteria_match':
      isEnabled = preferences.notifyOnCriteriaMatch ?? true; // Default to true
      break;
    case 'weekly_summary':
      isEnabled = preferences.notifyOnWeeklySummary ?? false;
      break;
  }

  // Only send immediate notifications (daily/weekly would be handled by cron)
  const shouldSend = isEnabled && preferences.frequency === 'immediate';

  return { shouldSend, preferences };
}

/**
 * Send notification email if user preferences allow it
 */
export async function sendNotificationIfEnabled(
  userId: string,
  notificationType: 'new_deal' | 'analysis_complete' | 'criteria_match' | 'weekly_summary',
  emailData: { subject: string; data: any },
  fallbackEmail?: string
): Promise<void> {
  try {
    const { shouldSend, preferences } = await shouldSendNotification(userId, notificationType);
    
    if (!shouldSend) {
      return;
    }

    // Get email from preferences, or use fallback (user's Clerk email)
    const email = preferences?.email || fallbackEmail;
    if (!email) {
      console.warn(`No email found for user ${userId}, skipping notification`);
      return;
    }

    await sendNotificationEmail({
      to: email,
      subject: emailData.subject,
      type: notificationType,
      data: emailData.data,
    });

    console.log(`Notification email sent to ${email} for ${notificationType}`);
  } catch (error) {
    // Don't throw - notification failures shouldn't break the main flow
    console.error(`Failed to send notification email for ${notificationType}:`, error);
  }
}

