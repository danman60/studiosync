import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

const classInput = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  season_id: z.string().uuid(),
  class_type_id: z.string().uuid(),
  level_id: z.string().uuid().nullable().optional(),
  instructor_id: z.string().uuid().nullable().optional(),
  day_of_week: z.number().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  room: z.string().max(100).nullable().optional(),
  capacity: z.number().min(1).max(500).optional(),
  monthly_price: z.number().min(0).nullable().optional(),
  drop_in_price: z.number().min(0).nullable().optional(),
  registration_fee: z.number().min(0).nullable().optional(),
  min_age: z.number().min(0).nullable().optional(),
  max_age: z.number().min(0).nullable().optional(),
  is_public: z.boolean().optional(),
  allow_drop_in: z.boolean().optional(),
});

export const adminRouter = router({
  // ── Classes ────────────────────────────────────────────

  listClasses: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('classes')
      .select('*, class_types(*), levels(*), seasons(*), staff(id, display_name)')
      .eq('studio_id', ctx.studioId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;
    return data ?? [];
  }),

  createClass: adminProcedure
    .input(classInput)
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('classes')
        .insert({
          studio_id: ctx.studioId,
          name: input.name,
          description: input.description ?? null,
          season_id: input.season_id,
          class_type_id: input.class_type_id,
          level_id: input.level_id ?? null,
          instructor_id: input.instructor_id ?? null,
          day_of_week: input.day_of_week,
          start_time: input.start_time,
          end_time: input.end_time,
          room: input.room ?? null,
          capacity: input.capacity ?? 20,
          monthly_price: input.monthly_price ?? null,
          drop_in_price: input.drop_in_price ?? null,
          registration_fee: input.registration_fee ?? null,
          min_age: input.min_age ?? null,
          max_age: input.max_age ?? null,
          is_public: input.is_public ?? true,
          allow_drop_in: input.allow_drop_in ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  updateClass: adminProcedure
    .input(z.object({ id: z.string().uuid() }).merge(classInput.partial()))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('classes')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  deleteClass: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Check for active enrollments
      const { count } = await supabase
        .from('enrollments')
        .select('id', { count: 'exact', head: true })
        .eq('class_id', input.id)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending', 'waitlisted']);

      if (count && count > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete class with ${count} active enrollment(s). Drop or cancel them first.`,
        });
      }

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  // ── Staff ──────────────────────────────────────────────

  listStaff: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .order('role')
      .order('display_name');

    if (error) throw error;
    return data ?? [];
  }),

  inviteStaff: adminProcedure
    .input(
      z.object({
        display_name: z.string().min(1).max(200),
        email: z.string().email(),
        role: z.enum(['admin', 'instructor', 'front_desk']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Check duplicate email in this studio
      const { data: existing } = await supabase
        .from('staff')
        .select('id')
        .eq('studio_id', ctx.studioId)
        .eq('email', input.email)
        .single();

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'A staff member with this email already exists.',
        });
      }

      // Create a placeholder auth user id — will be linked on first login
      const { data, error } = await supabase
        .from('staff')
        .insert({
          studio_id: ctx.studioId,
          auth_user_id: '00000000-0000-0000-0000-000000000000', // placeholder until magic link
          display_name: input.display_name,
          email: input.email,
          role: input.role,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  updateStaff: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        display_name: z.string().min(1).max(200).optional(),
        role: z.enum(['admin', 'instructor', 'front_desk']).optional(),
        phone: z.string().max(30).nullable().optional(),
        active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      // Prevent editing owner role
      const { data: target } = await supabase
        .from('staff')
        .select('role')
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Staff member not found.' });
      }
      if (target.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot modify the owner account.',
        });
      }

      const { data, error } = await supabase
        .from('staff')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  removeStaff: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: target } = await supabase
        .from('staff')
        .select('role')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!target) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Staff member not found.' });
      }
      if (target.role === 'owner') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Cannot remove the studio owner.',
        });
      }

      const { data, error } = await supabase
        .from('staff')
        .update({ active: false })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Supporting Lookups ─────────────────────────────────

  getSeasons: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  getClassTypes: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('class_types')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('sort_order');

    if (error) throw error;
    return data ?? [];
  }),

  getLevels: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('sort_order');

    if (error) throw error;
    return data ?? [];
  }),

  getInstructors: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('staff')
      .select('id, display_name, email')
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .in('role', ['instructor', 'admin', 'owner'])
      .order('display_name');

    if (error) throw error;
    return data ?? [];
  }),
});
