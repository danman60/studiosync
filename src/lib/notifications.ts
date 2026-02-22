import { createServiceClient } from './supabase-server';

export type NotificationType =
  | 'invoice_sent'
  | 'enrollment_confirmed'
  | 'message_received'
  | 'announcement'
  | 'event_reminder'
  | 'attendance_alert'
  | 'progress_update'
  | 'custom';

interface SendNotificationParams {
  studioId: string;
  familyId?: string;
  staffId?: string;
  type: NotificationType;
  subject: string;
  body: string;
  recipientEmail?: string;
  recipientPhone?: string;
  metadata?: Record<string, string>;
  studioName?: string;
}

// Map notification type to preference field
const TYPE_TO_PREF: Record<string, string> = {
  invoice_sent: 'invoice_notifications',
  enrollment_confirmed: 'enrollment_notifications',
  message_received: 'message_notifications',
  announcement: 'announcement_notifications',
  event_reminder: 'event_notifications',
  attendance_alert: 'attendance_notifications',
  progress_update: 'progress_notifications',
};

/**
 * Send notification with preference checking and delivery logging.
 * Fire-and-forget — logs errors silently so calling code isn't blocked.
 */
export async function sendNotification(params: SendNotificationParams): Promise<void> {
  try {
    const supabase = createServiceClient();

    // Check family notification preferences if familyId provided
    let shouldSendEmail = true;
    let shouldSendSms = false;
    let smsPhone = params.recipientPhone;

    if (params.familyId) {
      const { data: prefs } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('studio_id', params.studioId)
        .eq('family_id', params.familyId)
        .single();

      if (prefs) {
        // Check if this notification type is enabled
        const prefKey = TYPE_TO_PREF[params.type];
        if (prefKey && !(prefs as Record<string, unknown>)[prefKey]) {
          // Family opted out of this notification type — log as skipped
          await supabase.from('notification_log').insert({
            studio_id: params.studioId,
            family_id: params.familyId,
            staff_id: params.staffId ?? null,
            type: params.type,
            channel: 'email',
            subject: params.subject,
            body: params.body,
            recipient_email: params.recipientEmail ?? null,
            recipient_phone: params.recipientPhone ?? null,
            status: 'skipped',
            error_message: `Opted out: ${prefKey}`,
            metadata: params.metadata ?? {},
          });
          return;
        }
        shouldSendEmail = prefs.email_enabled;
        shouldSendSms = prefs.sms_enabled && !!prefs.phone_number;
        smsPhone = prefs.phone_number ?? smsPhone;
      }
    }

    // Log + attempt email delivery
    if (shouldSendEmail && params.recipientEmail) {
      const { data: logEntry } = await supabase.from('notification_log').insert({
        studio_id: params.studioId,
        family_id: params.familyId ?? null,
        staff_id: params.staffId ?? null,
        type: params.type,
        channel: 'email',
        subject: params.subject,
        body: params.body,
        recipient_email: params.recipientEmail,
        status: 'pending',
        metadata: params.metadata ?? {},
      }).select('id').single();

      // Try edge function delivery
      try {
        const { error } = await supabase.functions.invoke('send-notification', {
          body: {
            to: params.recipientEmail,
            subject: params.subject,
            type: params.type,
            body: params.body,
            studioName: params.studioName,
            channel: 'email',
          },
        });

        if (logEntry) {
          await supabase.from('notification_log')
            .update({
              status: error ? 'failed' : 'sent',
              error_message: error?.message ?? null,
              sent_at: error ? null : new Date().toISOString(),
            })
            .eq('id', logEntry.id);
        }
      } catch (err) {
        if (logEntry) {
          await supabase.from('notification_log')
            .update({
              status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', logEntry.id);
        }
      }
    }

    // Log + attempt SMS delivery
    if (shouldSendSms && smsPhone) {
      const { data: logEntry } = await supabase.from('notification_log').insert({
        studio_id: params.studioId,
        family_id: params.familyId ?? null,
        staff_id: params.staffId ?? null,
        type: params.type,
        channel: 'sms',
        subject: params.subject,
        body: params.body,
        recipient_phone: smsPhone,
        status: 'pending',
        metadata: params.metadata ?? {},
      }).select('id').single();

      try {
        const { error } = await supabase.functions.invoke('send-notification', {
          body: {
            to: smsPhone,
            subject: params.subject,
            type: params.type,
            body: params.body,
            studioName: params.studioName,
            channel: 'sms',
          },
        });

        if (logEntry) {
          await supabase.from('notification_log')
            .update({
              status: error ? 'failed' : 'sent',
              error_message: error?.message ?? null,
              sent_at: error ? null : new Date().toISOString(),
            })
            .eq('id', logEntry.id);
        }
      } catch (err) {
        if (logEntry) {
          await supabase.from('notification_log')
            .update({
              status: 'failed',
              error_message: err instanceof Error ? err.message : 'Unknown error',
            })
            .eq('id', logEntry.id);
        }
      }
    }
  } catch (err) {
    console.error('[notifications] Failed to send:', err);
  }
}
