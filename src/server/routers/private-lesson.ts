import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, instructorProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const privateLessonRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN: Full CRUD
  // ═══════════════════════════════════════════════════════

  list: adminProcedure
    .input(z.object({
      instructorId: z.string().uuid().optional(),
      familyId: z.string().uuid().optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('private_lessons')
        .select('*, staff(display_name), children(first_name, last_name), families(parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(200);

      if (input?.instructorId) query = query.eq('instructor_id', input.instructorId);
      if (input?.familyId) query = query.eq('family_id', input.familyId);
      if (input?.status) query = query.eq('status', input.status);
      if (input?.from) query = query.gte('lesson_date', input.from);
      if (input?.to) query = query.lte('lesson_date', input.to);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),

  create: adminProcedure
    .input(z.object({
      instructor_id: z.string().uuid(),
      child_id: z.string().uuid(),
      family_id: z.string().uuid(),
      title: z.string().max(200).optional(),
      lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
      duration_minutes: z.number().int().min(15).max(180).default(30),
      price: z.number().int().min(0).default(0),
      location: z.string().max(200).optional(),
      notes: z.string().max(2000).optional(),
      recurring: z.boolean().default(false),
      recurrence_rule: z.enum(['weekly', 'biweekly', 'monthly']).optional(),
      recurrence_count: z.number().int().min(1).max(52).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { recurrence_count, ...lessonData } = input;
      const lessons: Array<typeof lessonData & { studio_id: string; parent_recurrence_id?: string }> = [];

      // Create first lesson
      const first = { ...lessonData, studio_id: ctx.studioId };
      lessons.push(first);

      // Generate recurring instances
      if (input.recurring && input.recurrence_rule && recurrence_count && recurrence_count > 1) {
        for (let i = 1; i < recurrence_count; i++) {
          const date = new Date(input.lesson_date);
          if (input.recurrence_rule === 'weekly') date.setDate(date.getDate() + 7 * i);
          else if (input.recurrence_rule === 'biweekly') date.setDate(date.getDate() + 14 * i);
          else if (input.recurrence_rule === 'monthly') date.setMonth(date.getMonth() + i);

          lessons.push({
            ...lessonData,
            studio_id: ctx.studioId,
            lesson_date: date.toISOString().slice(0, 10),
          });
        }
      }

      const { data, error } = await supabase
        .from('private_lessons')
        .insert(lessons)
        .select();

      if (error) throw error;

      // Link recurring lessons to parent
      if (data && data.length > 1) {
        const parentId = data[0].id;
        const childIds = data.slice(1).map(d => d.id);
        await supabase
          .from('private_lessons')
          .update({ parent_recurrence_id: parentId })
          .in('id', childIds);
      }

      return data;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().max(200).optional(),
      lesson_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      start_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
      duration_minutes: z.number().int().min(15).max(180).optional(),
      price: z.number().int().min(0).optional(),
      status: z.enum(['scheduled', 'completed', 'cancelled', 'no_show']).optional(),
      location: z.string().max(200).nullable().optional(),
      notes: z.string().max(2000).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('private_lessons')
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
        .from('private_lessons')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    const [allRes, upcomingRes, completedRes] = await Promise.all([
      supabase.from('private_lessons').select('price').eq('studio_id', ctx.studioId),
      supabase.from('private_lessons').select('id', { count: 'exact', head: true })
        .eq('studio_id', ctx.studioId).eq('status', 'scheduled').gte('lesson_date', today),
      supabase.from('private_lessons').select('price')
        .eq('studio_id', ctx.studioId).eq('status', 'completed'),
    ]);

    return {
      total: allRes.data?.length ?? 0,
      upcoming: upcomingRes.count ?? 0,
      completedRevenue: (completedRes.data ?? []).reduce((s, l) => s + l.price, 0),
    };
  }),

  // ═══════════════════════════════════════════════════════
  // INSTRUCTOR: Own lessons
  // ═══════════════════════════════════════════════════════

  myLessons: instructorProcedure
    .input(z.object({
      from: z.string().optional(),
      to: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('private_lessons')
        .select('*, children(first_name, last_name), families(parent_first_name, parent_last_name)')
        .eq('studio_id', ctx.studioId)
        .eq('instructor_id', ctx.staffId)
        .order('lesson_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (input?.from) query = query.gte('lesson_date', input.from);
      if (input?.to) query = query.lte('lesson_date', input.to);

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    }),

  // Instructor availability
  getAvailability: instructorProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('instructor_availability')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('instructor_id', ctx.staffId)
      .eq('is_active', true)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;
    return data ?? [];
  }),

  setAvailability: instructorProcedure
    .input(z.array(z.object({
      day_of_week: z.number().int().min(0).max(6),
      start_time: z.string().regex(/^\d{2}:\d{2}$/),
      end_time: z.string().regex(/^\d{2}:\d{2}$/),
    })))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Delete existing
      await supabase
        .from('instructor_availability')
        .delete()
        .eq('studio_id', ctx.studioId)
        .eq('instructor_id', ctx.staffId);

      if (input.length === 0) return [];

      // Insert new
      const { data, error } = await supabase
        .from('instructor_availability')
        .insert(input.map(slot => ({
          studio_id: ctx.studioId,
          instructor_id: ctx.staffId,
          ...slot,
        })))
        .select();

      if (error) throw error;
      return data ?? [];
    }),

  // ═══════════════════════════════════════════════════════
  // PARENT: View own lessons
  // ═══════════════════════════════════════════════════════

  myChildLessons: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.familyId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No family account found' });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('private_lessons')
      .select('*, staff(display_name), children(first_name, last_name)')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .in('status', ['scheduled', 'completed'])
      .order('lesson_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  // Admin: view instructor availability
  instructorAvailability: adminProcedure
    .input(z.object({ instructorId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('instructor_availability')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('instructor_id', input.instructorId)
        .eq('is_active', true)
        .order('day_of_week')
        .order('start_time');

      if (error) throw error;
      return data ?? [];
    }),
});
