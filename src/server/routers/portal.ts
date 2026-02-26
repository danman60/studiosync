import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

/** Resolve family ID: prefer ctx.familyId (direct), fall back to auth_user_id lookup */
async function resolveFamilyId(
  supabase: ReturnType<typeof createServiceClient>,
  studioId: string,
  userId: string | null,
  familyId: string | null,
): Promise<string | null> {
  if (familyId) return familyId;
  if (userId) {
    const { data } = await supabase
      .from('families')
      .select('id')
      .eq('studio_id', studioId)
      .eq('auth_user_id', userId)
      .single();
    return data?.id ?? null;
  }
  return null;
}

export const portalRouter = router({
  // ── Dashboard ──────────────────────────────────────────

  dashboardData: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) {
      return { family: null, students: [], enrollments: [], upcomingClasses: [] };
    }

    // Get family info
    const { data: family } = await supabase
      .from('families')
      .select('id, parent_first_name, parent_last_name')
      .eq('id', familyId)
      .single();

    if (!family) {
      return { family: null, students: [], enrollments: [], upcomingClasses: [] };
    }

    // Students
    const { data: students } = await supabase
      .from('students')
      .select('id, first_name, last_name, date_of_birth, active')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('first_name');

    // Active enrollments with class details
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('id, status, students(first_name, last_name), classes(name, day_of_week, start_time, end_time, room, class_types(name, color), staff(display_name))')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .in('status', ['active', 'pending', 'waitlisted'])
      .order('created_at', { ascending: false });

    return {
      family,
      students: students ?? [],
      enrollments: enrollments ?? [],
    };
  }),

  // ── My Students ────────────────────────────────────────

  listStudents: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) return [];

    const { data, error } = await supabase
      .from('students')
      .select('*, enrollments(id, status, classes(name, class_types(name, color)))')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .order('first_name');

    if (error) throw error;
    return data ?? [];
  }),

  addStudent: protectedProcedure
    .input(
      z.object({
        first_name: z.string().min(1).max(100),
        last_name: z.string().min(1).max(100),
        date_of_birth: z.string().nullable().optional(),
        gender: z.string().nullable().optional(),
        medical_notes: z.string().max(2000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
      if (!familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found.' });
      }

      const { data, error } = await supabase
        .from('students')
        .insert({
          studio_id: ctx.studioId,
          family_id: familyId,
          first_name: input.first_name,
          last_name: input.last_name,
          date_of_birth: input.date_of_birth ?? null,
          gender: input.gender ?? null,
          medical_notes: input.medical_notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  updateStudent: protectedProcedure
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

      const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
      if (!familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found.' });
      }

      const { data, error } = await supabase
        .from('students')
        .update(updates)
        .eq('id', id)
        .eq('family_id', familyId)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Progress Marks ────────────────────────────────────

  studentProgressMarks: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) return [];

    // Get student IDs
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .eq('active', true);

    const studentIds = (students ?? []).map((c) => c.id);
    if (studentIds.length === 0) return [];

    const { data, error } = await supabase
      .from('progress_marks')
      .select('*, classes(name), students(first_name, last_name)')
      .eq('studio_id', ctx.studioId)
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  // ── Attendance ──────────────────────────────────────────

  studentAttendance: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) return [];

    // Get student IDs
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .eq('active', true);

    const studentIds = (students ?? []).map((c) => c.id);
    if (studentIds.length === 0) return [];

    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(first_name, last_name), class_sessions(session_date, classes(name))')
      .eq('studio_id', ctx.studioId)
      .in('student_id', studentIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;
    return data ?? [];
  }),

  // ── Payments ───────────────────────────────────────────

  listPayments: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) return [];

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('family_id', familyId)
      .eq('studio_id', ctx.studioId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data ?? [];
  }),

  // ── Report Card ──────────────────────────────────────────

  reportCard: protectedProcedure
    .input(z.object({
      studentId: z.string().uuid(),
      period: z.string().max(100).default('current'),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
      if (!familyId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });

      // Verify student belongs to family
      const { data: student } = await supabase
        .from('students')
        .select('id, first_name, last_name, date_of_birth')
        .eq('id', input.studentId)
        .eq('family_id', familyId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!student) throw new TRPCError({ code: 'NOT_FOUND', message: 'Student not found' });

      // Get studio info for report header
      const { data: studio } = await supabase
        .from('studios')
        .select('name, logo_url, phone, email, settings')
        .eq('id', ctx.studioId)
        .single();

      // Get enrollments with class info
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('id, class_id, classes(name, day_of_week, start_time, end_time, class_types(name), levels(name), seasons(name), instructor_id, staff(display_name))')
        .eq('student_id', input.studentId)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending']);

      // Get progress marks for this period
      const { data: marks } = await supabase
        .from('progress_marks')
        .select('*, classes(name), staff(display_name)')
        .eq('student_id', input.studentId)
        .eq('studio_id', ctx.studioId)
        .eq('period', input.period)
        .order('category');

      // Get attendance summary per class
      const { data: attendance } = await supabase
        .from('attendance')
        .select('status, class_sessions(class_id)')
        .eq('student_id', input.studentId)
        .eq('studio_id', ctx.studioId);

      // Compute attendance stats per class
      const attendanceByClass: Record<string, { present: number; absent: number; late: number; excused: number; total: number }> = {};
      for (const a of attendance ?? []) {
        const session = a.class_sessions as unknown as { class_id: string } | null;
        if (!session) continue;
        const cid = session.class_id;
        if (!attendanceByClass[cid]) attendanceByClass[cid] = { present: 0, absent: 0, late: 0, excused: 0, total: 0 };
        attendanceByClass[cid].total++;
        if (a.status === 'present') attendanceByClass[cid].present++;
        else if (a.status === 'absent') attendanceByClass[cid].absent++;
        else if (a.status === 'late') attendanceByClass[cid].late++;
        else if (a.status === 'excused') attendanceByClass[cid].excused++;
      }

      // Group marks by class
      const marksByClass: Record<string, typeof marks> = {};
      for (const m of marks ?? []) {
        (marksByClass[m.class_id] ??= []).push(m);
      }

      return {
        student,
        studio: studio ?? { name: '', logo_url: null, phone: null, email: null, settings: {} },
        period: input.period,
        enrollments: enrollments ?? [],
        marksByClass,
        attendanceByClass,
      };
    }),

  // ── Profile ────────────────────────────────────────────

  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
    if (!familyId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });

    const { data, error } = await supabase
      .from('families')
      .select('*')
      .eq('id', familyId)
      .eq('studio_id', ctx.studioId)
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

      const familyId = await resolveFamilyId(supabase, ctx.studioId, ctx.userId, ctx.familyId);
      if (!familyId) throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });

      const { data, error } = await supabase
        .from('families')
        .update(input)
        .eq('id', familyId)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),
});
