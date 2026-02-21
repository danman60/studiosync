import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { instructorProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const instructorRouter = router({
  // ── My Classes ─────────────────────────────────────────
  // Instructors see only classes assigned to them.
  // Admins/owners see all classes (they pass through instructorProcedure too).

  myClasses: instructorProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    let query = supabase
      .from('classes')
      .select('*, class_types(name, color), levels(name), seasons(name, is_current), staff(id, display_name)')
      .eq('studio_id', ctx.studioId);

    // Instructors only see their own classes; admins/owners see all
    if (ctx.userRole === 'instructor') {
      query = query.eq('instructor_id', ctx.staffId);
    }

    const { data, error } = await query
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;
    return data ?? [];
  }),

  // ── Class Roster ───────────────────────────────────────
  // Students enrolled in a specific class (active/pending only)

  classRoster: instructorProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify instructor owns this class (unless admin/owner)
      if (ctx.userRole === 'instructor') {
        const { data: cls } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', input.classId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!cls || cls.instructor_id !== ctx.staffId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
        }
      }

      const { data, error } = await supabase
        .from('enrollments')
        .select('id, status, child_id, children(id, first_name, last_name, date_of_birth, medical_notes)')
        .eq('class_id', input.classId)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending']);

      if (error) throw error;
      return data ?? [];
    }),

  // ── Get/Create Session ─────────────────────────────────
  // Returns existing session for a date, or creates one from class defaults

  getSession: instructorProcedure
    .input(z.object({
      classId: z.string().uuid(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify instructor owns this class
      if (ctx.userRole === 'instructor') {
        const { data: cls } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', input.classId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!cls || cls.instructor_id !== ctx.staffId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
        }
      }

      // Try to find existing session
      const { data: existing } = await supabase
        .from('class_sessions')
        .select('*')
        .eq('class_id', input.classId)
        .eq('session_date', input.date)
        .eq('studio_id', ctx.studioId)
        .single();

      if (existing) return existing;

      // Create from class defaults
      const { data: cls } = await supabase
        .from('classes')
        .select('start_time, end_time')
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!cls) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Class not found' });
      }

      const { data: session, error } = await supabase
        .from('class_sessions')
        .insert({
          studio_id: ctx.studioId,
          class_id: input.classId,
          session_date: input.date,
          start_time: cls.start_time,
          end_time: cls.end_time,
        })
        .select()
        .single();

      if (error) throw error;
      return session;
    }),

  // ── Mark Attendance ────────────────────────────────────
  // Bulk upsert attendance for a session

  markAttendance: instructorProcedure
    .input(z.object({
      sessionId: z.string().uuid(),
      records: z.array(z.object({
        childId: z.string().uuid(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        notes: z.string().max(500).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify session belongs to a class the instructor owns
      const { data: session } = await supabase
        .from('class_sessions')
        .select('id, class_id, classes(instructor_id)')
        .eq('id', input.sessionId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      const classData = session.classes as unknown as { instructor_id: string | null };
      if (ctx.userRole === 'instructor' && classData?.instructor_id !== ctx.staffId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
      }

      // Verify all children are enrolled in this class
      const childIds = input.records.map((r) => r.childId);
      const { data: enrolled } = await supabase
        .from('enrollments')
        .select('child_id')
        .eq('class_id', session.class_id)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending'])
        .in('child_id', childIds);

      const enrolledIds = new Set((enrolled ?? []).map((e) => e.child_id));
      const unenrolled = childIds.filter((id) => !enrolledIds.has(id));
      if (unenrolled.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Cannot mark attendance for unenrolled students: ${unenrolled.join(', ')}`,
        });
      }

      // Upsert attendance records
      const rows = input.records.map((r) => ({
        studio_id: ctx.studioId,
        class_session_id: input.sessionId,
        child_id: r.childId,
        status: r.status,
        marked_by: ctx.staffId,
        notes: r.notes ?? null,
      }));

      const { data, error } = await supabase
        .from('attendance')
        .upsert(rows, { onConflict: 'class_session_id,child_id' })
        .select();

      if (error) throw error;

      // Mark session as completed
      await supabase
        .from('class_sessions')
        .update({ status: 'completed' })
        .eq('id', input.sessionId)
        .eq('studio_id', ctx.studioId);

      return data ?? [];
    }),

  // ── Get Attendance ─────────────────────────────────────
  // Attendance records for a specific session

  getAttendance: instructorProcedure
    .input(z.object({ sessionId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify session ownership
      const { data: session } = await supabase
        .from('class_sessions')
        .select('id, classes(instructor_id)')
        .eq('id', input.sessionId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!session) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Session not found' });
      }

      const classData = session.classes as unknown as { instructor_id: string | null };
      if (ctx.userRole === 'instructor' && classData?.instructor_id !== ctx.staffId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('*, children(first_name, last_name)')
        .eq('class_session_id', input.sessionId)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return data ?? [];
    }),

  // ── Attendance Summary ─────────────────────────────────
  // Aggregate stats for a class over a date range

  attendanceSummary: instructorProcedure
    .input(z.object({
      classId: z.string().uuid(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify ownership
      if (ctx.userRole === 'instructor') {
        const { data: cls } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', input.classId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!cls || cls.instructor_id !== ctx.staffId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
        }
      }

      // Get sessions in range
      let sessionQuery = supabase
        .from('class_sessions')
        .select('id, session_date, status')
        .eq('class_id', input.classId)
        .eq('studio_id', ctx.studioId)
        .order('session_date', { ascending: false });

      if (input.startDate) sessionQuery = sessionQuery.gte('session_date', input.startDate);
      if (input.endDate) sessionQuery = sessionQuery.lte('session_date', input.endDate);

      const { data: sessions } = await sessionQuery;
      if (!sessions || sessions.length === 0) {
        return { totalSessions: 0, completedSessions: 0, attendanceByStatus: {} };
      }

      const sessionIds = sessions.map((s) => s.id);
      const { data: records } = await supabase
        .from('attendance')
        .select('status')
        .eq('studio_id', ctx.studioId)
        .in('class_session_id', sessionIds);

      const attendanceByStatus: Record<string, number> = {};
      for (const r of records ?? []) {
        attendanceByStatus[r.status] = (attendanceByStatus[r.status] ?? 0) + 1;
      }

      return {
        totalSessions: sessions.length,
        completedSessions: sessions.filter((s) => s.status === 'completed').length,
        attendanceByStatus,
      };
    }),

  // ── Student Info ───────────────────────────────────────
  // Limited student details: name, age, medical notes only

  studentInfo: instructorProcedure
    .input(z.object({
      childId: z.string().uuid(),
      classId: z.string().uuid(),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify the student is enrolled in one of instructor's classes
      if (ctx.userRole === 'instructor') {
        const { data: cls } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', input.classId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!cls || cls.instructor_id !== ctx.staffId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
        }
      }

      // Verify enrollment
      const { data: enrollment } = await supabase
        .from('enrollments')
        .select('id')
        .eq('child_id', input.childId)
        .eq('class_id', input.classId)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending'])
        .single();

      if (!enrollment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Student not enrolled in this class' });
      }

      // Return limited info only
      const { data: child, error } = await supabase
        .from('children')
        .select('id, first_name, last_name, date_of_birth, medical_notes')
        .eq('id', input.childId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (error || !child) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Student not found' });
      }

      return child;
    }),
});
