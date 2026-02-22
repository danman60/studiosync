import { z } from 'zod';
import { adminProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

const MERGE_FIELD_OPTIONS = [
  '{first_name}',
  '{last_name}',
  '{family_name}',
  '{student_name}',
  '{class_name}',
  '{studio_name}',
  '{amount}',
  '{due_date}',
  '{event_name}',
  '{event_date}',
];

export const messageTemplateRouter = router({
  list: adminProcedure
    .input(z.object({
      category: z.string().optional(),
      activeOnly: z.boolean().default(true),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('message_templates')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .order('category')
        .order('name');

      if (input?.category) query = query.eq('category', input.category);
      if (input?.activeOnly !== false) query = query.eq('is_active', true);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      subject: z.string().max(500).optional(),
      body: z.string().min(1).max(10000),
      category: z.enum(['general', 'billing', 'enrollment', 'attendance', 'announcement', 'reminder']).default('general'),
      merge_fields: z.array(z.string()).default([]),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('message_templates')
        .insert({
          studio_id: ctx.studioId,
          ...input,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      subject: z.string().max(500).nullable().optional(),
      body: z.string().min(1).max(10000).optional(),
      category: z.enum(['general', 'billing', 'enrollment', 'attendance', 'announcement', 'reminder']).optional(),
      merge_fields: z.array(z.string()).optional(),
      is_active: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { id, ...updates } = input;
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  mergeFieldOptions: adminProcedure.query(() => {
    return MERGE_FIELD_OPTIONS;
  }),

  /** Preview a template with sample data */
  preview: adminProcedure
    .input(z.object({
      body: z.string(),
      subject: z.string().optional(),
    }))
    .query(({ input }) => {
      const sampleData: Record<string, string> = {
        '{first_name}': 'Jane',
        '{last_name}': 'Smith',
        '{family_name}': 'Smith Family',
        '{student_name}': 'Emma Smith',
        '{class_name}': 'Jazz Level 2',
        '{studio_name}': 'My Dance Studio',
        '{amount}': '$125.00',
        '{due_date}': '2026-03-15',
        '{event_name}': 'Spring Recital',
        '{event_date}': '2026-06-20',
      };

      let previewBody = input.body;
      let previewSubject = input.subject ?? '';

      for (const [key, val] of Object.entries(sampleData)) {
        previewBody = previewBody.replaceAll(key, val);
        previewSubject = previewSubject.replaceAll(key, val);
      }

      return { body: previewBody, subject: previewSubject };
    }),
});
