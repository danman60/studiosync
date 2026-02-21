import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const portalRouter = router({
  // ── Dashboard ──────────────────────────────────────────

  dashboardData: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    // Get family for this user
    const { data: family } = await supabase
      .from('families')
      .select('id, parent_first_name, parent_last_name')
      .eq('studio_id', ctx.studioId)
      .eq('auth_user_id', ctx.userId)
      .single();

    if (!family) {
      return { family: null, children: [], enrollments: [], upcomingClasses: [] };
    }

    // Children
    const { data: children } = await supabase
      .from('children')
      .select('id, first_name, last_name, date_of_birth, active')
      .eq('family_id', family.id)
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('first_name');

    // Active enrollments with class details
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, status, children(first_name, last_name), classes(name, day_of_week, start_time, end_time, room, class_types(name, color), staff(display_name))')
      .eq('family_id', family.id)
      .eq('studio_id', ctx.studioId)
      .in('status', ['active', 'pending', 'waitlisted'])
      .order('created_at', { ascending: false });

    return {
      family,
      children: children ?? [],
      enrollments: enrollments ?? [],
    };
  }),

  // ── My Children ────────────────────────────────────────

  listChildren: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('studio_id', ctx.studioId)
      .eq('auth_user_id', ctx.userId)
      .single();

    if (!family) return [];

    const { data, error } = await supabase
      .from('children')
      .select('*, enrollments(id, status, classes(name, class_types(name, color)))')
      .eq('family_id', family.id)
      .eq('studio_id', ctx.studioId)
      .order('first_name');

    if (error) throw error;
    return data ?? [];
  }),

  updateChild: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        first_name: z.string().min(1).max(100).optional(),
        last_name: z.string().min(1).max(100).optional(),
        date_of_birth: z.string().nullable().optional(),
        gender: z.string().nullable().optional(),
        medical_notes: z.string().max(2000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      // Verify child belongs to user's family
      const { data: family } = await supabase
        .from('families')
        .select('id')
        .eq('studio_id', ctx.studioId)
        .eq('auth_user_id', ctx.userId)
        .single();

      if (!family) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found.' });
      }

      const { data, error } = await supabase
        .from('children')
        .update(updates)
        .eq('id', id)
        .eq('family_id', family.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Payments ───────────────────────────────────────────

  listPayments: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('studio_id', ctx.studioId)
      .eq('auth_user_id', ctx.userId)
      .single();

    if (!family) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('family_id', family.id)
      .eq('studio_id', ctx.studioId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  }),

  // ── Profile ────────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('auth_user_id', ctx.userId)
      .single();

    if (error) throw error;
    return data;
  }),

  updateProfile: protectedProcedure
    .input(
      z.object({
        parent_first_name: z.string().min(1).max(100).optional(),
        parent_last_name: z.string().min(1).max(100).optional(),
        phone: z.string().max(30).nullable().optional(),
        emergency_contact_name: z.string().max(200).nullable().optional(),
        emergency_contact_phone: z.string().max(30).nullable().optional(),
        address_line1: z.string().max(200).nullable().optional(),
        address_line2: z.string().max(200).nullable().optional(),
        city: z.string().max(100).nullable().optional(),
        state: z.string().max(50).nullable().optional(),
        zip: z.string().max(20).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from('families')
        .update(input)
        .eq('studio_id', ctx.studioId)
        .eq('auth_user_id', ctx.userId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),
});
