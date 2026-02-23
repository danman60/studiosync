import { z } from 'zod';
import { adminProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const scheduledMessageRouter = router({
  /** List scheduled messages with optional status filter */
  list: adminProcedure
    .input(z.object({
      status: z.enum(['scheduled', 'sent', 'cancelled', 'failed']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('scheduled_messages')
        .select('*, staff(display_name)')
        .eq('studio_id', ctx.studioId)
        .order('scheduled_at', { ascending: false });

      if (input?.status) query = query.eq('status', input.status);

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data ?? [];
    }),

  /** Create a scheduled message */
  create: adminProcedure
    .input(z.object({
      subject: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      channel: z.enum(['email', 'sms']).default('email'),
      scheduled_at: z.string(),
      target_type: z.enum(['all', 'class', 'level', 'class_type', 'tag']).default('all'),
      target_id: z.string().uuid().optional(),
      target_tag: z.string().optional(),
      template_id: z.string().uuid().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      if (!ctx.staffId) throw new Error('Staff ID required');

      const { data, error } = await supabase
        .from('scheduled_messages')
        .insert({
          studio_id: ctx.studioId,
          author_id: ctx.staffId,
          subject: input.subject,
          body: input.body,
          channel: input.channel,
          scheduled_at: input.scheduled_at,
          target_type: input.target_type,
          target_id: input.target_id ?? null,
          target_tag: input.target_tag ?? null,
          template_id: input.template_id ?? null,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update a pending scheduled message */
  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      subject: z.string().min(1).max(200).optional(),
      body: z.string().min(1).max(10000).optional(),
      channel: z.enum(['email', 'sms']).optional(),
      scheduled_at: z.string().optional(),
      target_type: z.enum(['all', 'class', 'level', 'class_type', 'tag']).optional(),
      target_id: z.string().uuid().nullable().optional(),
      target_tag: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from('scheduled_messages')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .eq('status', 'scheduled')
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Cancel a pending scheduled message */
  cancel: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('scheduled_messages')
        .update({ status: 'cancelled' })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .eq('status', 'scheduled')
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Delete a cancelled or sent message */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('scheduled_messages')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .in('status', ['cancelled', 'sent', 'failed']);

      if (error) throw error;
      return { success: true };
    }),
});
