import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const notificationRouter = router({
  // ═══════════════════════════════════════════════════════
  // PARENT: Get/update notification preferences
  // ═══════════════════════════════════════════════════════

  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.familyId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No family account found' });
    }

    const supabase = createServiceClient();
    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .single();

    // Return defaults if no preferences saved yet
    if (!data) {
      return {
        email_enabled: true,
        sms_enabled: false,
        push_enabled: false,
        invoice_notifications: true,
        enrollment_notifications: true,
        message_notifications: true,
        announcement_notifications: true,
        event_notifications: true,
        attendance_notifications: false,
        progress_notifications: true,
        phone_number: null as string | null,
      };
    }

    return data;
  }),

  updatePreferences: protectedProcedure
    .input(z.object({
      email_enabled: z.boolean().optional(),
      sms_enabled: z.boolean().optional(),
      push_enabled: z.boolean().optional(),
      invoice_notifications: z.boolean().optional(),
      enrollment_notifications: z.boolean().optional(),
      message_notifications: z.boolean().optional(),
      announcement_notifications: z.boolean().optional(),
      event_notifications: z.boolean().optional(),
      attendance_notifications: z.boolean().optional(),
      progress_notifications: z.boolean().optional(),
      phone_number: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family account found' });
      }

      const supabase = createServiceClient();

      // Upsert preferences
      const { data, error } = await supabase
        .from('notification_preferences')
        .upsert({
          studio_id: ctx.studioId,
          family_id: ctx.familyId,
          ...input,
        }, {
          onConflict: 'studio_id,family_id',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ═══════════════════════════════════════════════════════
  // ADMIN: Notification log + analytics
  // ═══════════════════════════════════════════════════════

  log: adminProcedure
    .input(z.object({
      type: z.string().optional(),
      status: z.string().optional(),
      familyId: z.string().uuid().optional(),
      limit: z.number().min(1).max(200).default(50),
      offset: z.number().min(0).default(0),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('notification_log')
        .select('*, families(parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId)
        .order('created_at', { ascending: false })
        .range(input?.offset ?? 0, (input?.offset ?? 0) + (input?.limit ?? 50) - 1);

      if (input?.type) query = query.eq('type', input.type);
      if (input?.status) query = query.eq('status', input.status);
      if (input?.familyId) query = query.eq('family_id', input.familyId);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    // Get counts by status in last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: logs } = await supabase
      .from('notification_log')
      .select('status, channel, type')
      .eq('studio_id', ctx.studioId)
      .gte('created_at', thirtyDaysAgo);

    const stats = {
      total: logs?.length ?? 0,
      sent: logs?.filter(l => l.status === 'sent' || l.status === 'delivered').length ?? 0,
      failed: logs?.filter(l => l.status === 'failed').length ?? 0,
      skipped: logs?.filter(l => l.status === 'skipped').length ?? 0,
      pending: logs?.filter(l => l.status === 'pending').length ?? 0,
      byChannel: {
        email: logs?.filter(l => l.channel === 'email').length ?? 0,
        sms: logs?.filter(l => l.channel === 'sms').length ?? 0,
        push: logs?.filter(l => l.channel === 'push').length ?? 0,
      },
      byType: {} as Record<string, number>,
    };

    for (const log of logs ?? []) {
      stats.byType[log.type] = (stats.byType[log.type] ?? 0) + 1;
    }

    return stats;
  }),
});
