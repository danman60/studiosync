import { createServiceClient } from './supabase-server';

type NotificationType = 'invoice_sent' | 'enrollment_confirmed' | 'message_received' | 'announcement' | 'custom';

interface SendNotificationParams {
  to: string;
  subject: string;
  type: NotificationType;
  data: Record<string, string>;
  studioName?: string;
}

/**
 * Fire-and-forget notification via Supabase Edge Function.
 * Does not throw — logs errors silently so calling code isn't blocked.
 */
export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.functions.invoke('send-notification', {
      body: params,
    });
    if (error) {
      console.error('[notifications] Edge function error:', error.message);
    }
  } catch (err) {
    console.error('[notifications] Failed to send:', err);
  }
}
