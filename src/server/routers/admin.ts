import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, ownerProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';

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

  getSeasons: adminProcedure
    .input(z.object({ includeArchived: z.boolean().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('seasons')
        .select('*')
        .eq('studio_id', ctx.studioId);

      if (!input?.includeArchived) {
        query = query.eq('archived', false);
      }

      const { data, error } = await query.order('start_date', { ascending: false });
      if (error) throw error;
      return data ?? [];
    }),

  archiveSeason: adminProcedure
    .input(z.object({ id: z.string().uuid(), archived: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('seasons')
        .update({ archived: input.archived, is_current: input.archived ? false : undefined })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
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

  // ── Studio Settings ──────────────────────────────────

  updateStudio: ownerProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200).optional(),
        email: z.string().email().nullable().optional(),
        phone: z.string().max(30).nullable().optional(),
        website: z.string().max(500).nullable().optional(),
        address_line1: z.string().max(500).nullable().optional(),
        city: z.string().max(100).nullable().optional(),
        state: z.string().max(50).nullable().optional(),
        zip: z.string().max(20).nullable().optional(),
        primary_color: z.string().max(20).nullable().optional(),
        secondary_color: z.string().max(20).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('studios')
        .update(input)
        .eq('id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Get studio settings (JSONB) */
  getSettings: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('studios')
      .select('settings')
      .eq('id', ctx.studioId)
      .single();

    return (data?.settings ?? {}) as Record<string, unknown>;
  }),

  /** Update studio settings (merges into JSONB) */
  updateSettings: adminProcedure
    .input(z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get current settings
      const { data: studio } = await supabase
        .from('studios')
        .select('settings')
        .eq('id', ctx.studioId)
        .single();

      const current = (studio?.settings ?? {}) as Record<string, unknown>;
      const merged = { ...current, ...input };

      const { data, error } = await supabase
        .from('studios')
        .update({ settings: merged })
        .eq('id', ctx.studioId)
        .select('settings')
        .single();

      if (error) throw error;
      return data?.settings as Record<string, unknown>;
    }),

  // ── Attendance Reports ─────────────────────────────────

  attendanceReport: adminProcedure
    .input(
      z.object({
        startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get all sessions in date range
      let sessionQuery = supabase
        .from('class_sessions')
        .select('id, class_id, session_date, status, classes(name)')
        .eq('studio_id', ctx.studioId)
        .order('session_date', { ascending: false });

      if (input?.startDate) sessionQuery = sessionQuery.gte('session_date', input.startDate);
      if (input?.endDate) sessionQuery = sessionQuery.lte('session_date', input.endDate);

      const { data: sessions } = await sessionQuery.limit(500);
      if (!sessions || sessions.length === 0) {
        return { sessions: [], attendanceByClass: [], absenteeReport: [] };
      }

      const sessionIds = sessions.map((s) => s.id);
      const { data: records } = await supabase
        .from('attendance')
        .select('*, children(first_name, last_name), class_sessions(class_id, session_date, classes(name))')
        .eq('studio_id', ctx.studioId)
        .in('class_session_id', sessionIds);

      // Aggregate by class
      const classTotals: Record<string, { name: string; present: number; absent: number; late: number; excused: number; total: number }> = {};
      for (const r of records ?? []) {
        const cs = r.class_sessions as unknown as { class_id: string; classes: { name: string } | null } | null;
        const classId = cs?.class_id ?? 'unknown';
        const className = cs?.classes?.name ?? 'Unknown';
        if (!classTotals[classId]) {
          classTotals[classId] = { name: className, present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        }
        classTotals[classId]!.total++;
        if (r.status === 'present') classTotals[classId]!.present++;
        else if (r.status === 'absent') classTotals[classId]!.absent++;
        else if (r.status === 'late') classTotals[classId]!.late++;
        else if (r.status === 'excused') classTotals[classId]!.excused++;
      }

      // Absentee report — students with >30% absences
      const studentTotals: Record<string, { name: string; absent: number; total: number }> = {};
      for (const r of records ?? []) {
        const child = r.children as unknown as { first_name: string; last_name: string } | null;
        if (!child) continue;
        const key = r.child_id;
        if (!studentTotals[key]) {
          studentTotals[key] = { name: `${child.first_name} ${child.last_name}`, absent: 0, total: 0 };
        }
        studentTotals[key]!.total++;
        if (r.status === 'absent') studentTotals[key]!.absent++;
      }

      const absenteeReport = Object.entries(studentTotals)
        .filter(([, v]) => v.total > 0 && v.absent / v.total > 0.3)
        .map(([id, v]) => ({ childId: id, ...v, rate: Math.round((v.absent / v.total) * 100) }))
        .sort((a, b) => b.rate - a.rate);

      return {
        sessions: sessions.slice(0, 50),
        attendanceByClass: Object.entries(classTotals).map(([id, v]) => ({ classId: id, ...v })),
        absenteeReport,
      };
    }),

  // ── Bulk Enrollment Import ────────────────────────────
  // Import multiple enrollments from CSV-like data

  bulkEnroll: adminProcedure
    .input(z.object({
      classId: z.string().uuid(),
      entries: z.array(z.object({
        childId: z.string().uuid(),
        familyId: z.string().uuid(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify class exists
      const { data: cls } = await supabase
        .from('classes')
        .select('id, capacity')
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!cls) throw new TRPCError({ code: 'NOT_FOUND', message: 'Class not found' });

      // Check for existing enrollments
      const childIds = input.entries.map((e) => e.childId);
      const { data: existing } = await supabase
        .from('enrollments')
        .select('child_id')
        .eq('class_id', input.classId)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending', 'waitlisted'])
        .in('child_id', childIds);

      const existingIds = new Set((existing ?? []).map((e) => e.child_id));
      const newEntries = input.entries.filter((e) => !existingIds.has(e.childId));

      if (newEntries.length === 0) {
        return { enrolled: 0, skipped: input.entries.length };
      }

      const rows = newEntries.map((e) => ({
        studio_id: ctx.studioId,
        class_id: input.classId,
        child_id: e.childId,
        family_id: e.familyId,
        status: 'active' as const,
      }));

      const { data, error } = await supabase
        .from('enrollments')
        .insert(rows)
        .select();

      if (error) throw error;
      return { enrolled: data?.length ?? 0, skipped: input.entries.length - newEntries.length };
    }),

  // ── Waitlist Management ────────────────────────────────

  promoteFromWaitlist: adminProcedure
    .input(z.object({ enrollmentId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id, status, class_id, classes(capacity)')
        .eq('id', input.enrollmentId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!enrollment) throw new TRPCError({ code: 'NOT_FOUND' });
      if (enrollment.status !== 'waitlisted') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only waitlisted enrollments can be promoted' });
      }

      // Check capacity
      const cls = enrollment.classes as unknown as { capacity: number | null } | null;
      if (cls?.capacity) {
        const { count } = await supabase
          .from('enrollments')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', enrollment.class_id)
          .eq('studio_id', ctx.studioId)
          .in('status', ['active', 'pending']);

        if ((count ?? 0) >= cls.capacity) {
          throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Class is at capacity' });
        }
      }

      const { data, error } = await supabase
        .from('enrollments')
        .update({ status: 'active' })
        .eq('id', input.enrollmentId)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Stripe Connect ──────────────────────────────────────

  stripeConnectUrl: ownerProcedure.mutation(async ({ ctx }) => {
    const supabase = createServiceClient();
    const stripe = getStripe();

    // Check if studio already has a Stripe account
    const { data: studio } = await supabase
      .from('studios')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', ctx.studioId)
      .single();

    let accountId = studio?.stripe_account_id;

    if (!accountId) {
      // Create a new Stripe Connect Standard account
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { studio_id: ctx.studioId },
      });
      accountId = account.id;

      // Save account ID to studio
      await supabase
        .from('studios')
        .update({ stripe_account_id: accountId })
        .eq('id', ctx.studioId);
    }

    // Create an account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/settings?stripe=refresh`,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/admin/settings?stripe=success`,
      type: 'account_onboarding',
    });

    return { url: accountLink.url };
  }),

  stripeConnectStatus: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: studio } = await supabase
      .from('studios')
      .select('stripe_account_id, stripe_onboarding_complete')
      .eq('id', ctx.studioId)
      .single();

    if (!studio?.stripe_account_id) {
      return { connected: false, chargesEnabled: false, payoutsEnabled: false };
    }

    try {
      const stripe = getStripe();
      const account = await stripe.accounts.retrieve(studio.stripe_account_id);

      const connected = account.charges_enabled && account.payouts_enabled;

      // Update onboarding status if newly completed
      if (connected && !studio.stripe_onboarding_complete) {
        await supabase
          .from('studios')
          .update({ stripe_onboarding_complete: true })
          .eq('id', ctx.studioId);
      }

      return {
        connected,
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
      };
    } catch {
      return { connected: false, chargesEnabled: false, payoutsEnabled: false };
    }
  }),

  // ── Report Card Overview ──────────────────────────────

  reportCardOverview: adminProcedure
    .input(z.object({ period: z.string().max(100).default('current') }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const period = input?.period ?? 'current';

      // Get all classes with enrollment counts
      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, class_types(name), levels(name), staff(display_name)')
        .eq('studio_id', ctx.studioId)
        .eq('is_active', true);

      if (!classes?.length) return [];

      // Get enrolled student counts per class
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, child_id')
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending']);

      // Get marks for this period grouped by class
      const { data: marks } = await supabase
        .from('progress_marks')
        .select('class_id, child_id')
        .eq('studio_id', ctx.studioId)
        .eq('period', period);

      // Calculate per-class stats
      const enrollmentsByClass: Record<string, Set<string>> = {};
      for (const e of enrollments ?? []) {
        if (!enrollmentsByClass[e.class_id]) enrollmentsByClass[e.class_id] = new Set();
        enrollmentsByClass[e.class_id].add(e.child_id);
      }

      const markedByClass: Record<string, Set<string>> = {};
      for (const m of marks ?? []) {
        if (!markedByClass[m.class_id]) markedByClass[m.class_id] = new Set();
        markedByClass[m.class_id].add(m.child_id);
      }

      return classes.map((cls) => {
        const enrolledCount = enrollmentsByClass[cls.id]?.size ?? 0;
        const markedCount = markedByClass[cls.id]?.size ?? 0;
        const classTypes = cls.class_types as unknown as { name: string } | null;
        const levels = cls.levels as unknown as { name: string } | null;
        const staff = cls.staff as unknown as { display_name: string } | null;

        return {
          id: cls.id,
          name: cls.name,
          classType: classTypes?.name ?? null,
          level: levels?.name ?? null,
          instructor: staff?.display_name ?? null,
          enrolledStudents: enrolledCount,
          markedStudents: markedCount,
          completionPercent: enrolledCount > 0 ? Math.round((markedCount / enrolledCount) * 100) : 0,
        };
      });
    }),
});
