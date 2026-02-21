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
  // ── Dashboard ──────────────────────────────────────────

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const sid = ctx.studioId;

    const [classesRes, enrollmentsRes, familiesRes, staffRes] = await Promise.all([
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('studio_id', sid).in('status', ['active', 'pending']),
      supabase.from('families').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('active', true),
    ]);

    // Recent enrollments
    const { data: recentEnrollments } = await supabase
      .from('enrollments')
      .select('id, status, created_at, children(first_name, last_name), classes(name)')
      .eq('studio_id', sid)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      totalClasses: classesRes.count ?? 0,
      activeEnrollments: enrollmentsRes.count ?? 0,
      totalFamilies: familiesRes.count ?? 0,
      activeStaff: staffRes.count ?? 0,
      recentEnrollments: recentEnrollments ?? [],
    };
  }),

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

      const { data, error } = await supabase
        .from('staff')
        .insert({
          studio_id: ctx.studioId,
          auth_user_id: '00000000-0000-0000-0000-000000000000',
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

  // ── Seasons ────────────────────────────────────────────

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

  createSeason: adminProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        registration_opens_at: z.string().nullable().optional(),
        registration_closes_at: z.string().nullable().optional(),
        is_current: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // If setting as current, unset others
      if (input.is_current) {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('studio_id', ctx.studioId)
          .eq('is_current', true);
      }

      const { data, error } = await supabase
        .from('seasons')
        .insert({
          studio_id: ctx.studioId,
          name: input.name,
          start_date: input.start_date,
          end_date: input.end_date,
          registration_opens_at: input.registration_opens_at ?? null,
          registration_closes_at: input.registration_closes_at ?? null,
          is_current: input.is_current ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  updateSeason: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(200).optional(),
        start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        registration_opens_at: z.string().nullable().optional(),
        registration_closes_at: z.string().nullable().optional(),
        is_current: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      if (updates.is_current) {
        await supabase
          .from('seasons')
          .update({ is_current: false })
          .eq('studio_id', ctx.studioId)
          .eq('is_current', true);
      }

      const { data, error } = await supabase
        .from('seasons')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  deleteSeason: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { count } = await supabase
        .from('classes')
        .select('id', { count: 'exact', head: true })
        .eq('season_id', input.id)
        .eq('studio_id', ctx.studioId);

      if (count && count > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Cannot delete season with ${count} class(es). Remove or reassign them first.`,
        });
      }

      const { error } = await supabase
        .from('seasons')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  // ── Enrollments ────────────────────────────────────────

  listEnrollments: adminProcedure
    .input(
      z.object({
        classId: z.string().uuid().optional(),
        status: z.enum(['pending', 'active', 'waitlisted', 'dropped', 'cancelled']).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('enrollments')
        .select('*, children(first_name, last_name), classes(name, class_types(name, color)), families(parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId);

      if (input?.classId) query = query.eq('class_id', input.classId);
      if (input?.status) query = query.eq('status', input.status);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data ?? [];
    }),

  updateEnrollmentStatus: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['active', 'dropped', 'cancelled']),
        drop_reason: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const updateData: Record<string, unknown> = { status: input.status };
      if (input.status === 'dropped') {
        updateData.dropped_at = new Date().toISOString();
        updateData.drop_reason = input.drop_reason ?? null;
      }

      const { data, error } = await supabase
        .from('enrollments')
        .update(updateData)
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select('*, children(first_name, last_name), classes(name)')
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Families ───────────────────────────────────────────

  listFamilies: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('families')
      .select('*, children(id, first_name, last_name, active)')
      .eq('studio_id', ctx.studioId)
      .order('parent_last_name')
      .order('parent_first_name');

    if (error) throw error;
    return data ?? [];
  }),

  getFamily: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('families')
        .select('*, children(*, enrollments(*, classes(name, class_types(name, color))))')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (error) throw error;
      return data;
    }),

  updateFamily: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        parent_first_name: z.string().min(1).max(100).optional(),
        parent_last_name: z.string().min(1).max(100).optional(),
        email: z.string().email().optional(),
        phone: z.string().max(30).nullable().optional(),
        emergency_contact_name: z.string().max(200).nullable().optional(),
        emergency_contact_phone: z.string().max(30).nullable().optional(),
        notes: z.string().max(2000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Supporting Lookups ─────────────────────────────────

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
