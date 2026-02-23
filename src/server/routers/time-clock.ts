import { z } from 'zod';
import { adminProcedure, instructorProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const timeClockRouter = router({
  // ═══════════════════════════════════════════════════════
  // INSTRUCTOR PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Check if currently clocked in */
  currentStatus: instructorProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('time_clock_entries')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('staff_id', ctx.staffId)
      .is('clock_out', null)
      .order('clock_in', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data;
  }),

  /** Clock in */
  clockIn: instructorProcedure
    .input(z.object({ notes: z.string().max(500).optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Check not already clocked in
      const { data: existing } = await supabase
        .from('time_clock_entries')
        .select('id')
        .eq('studio_id', ctx.studioId)
        .eq('staff_id', ctx.staffId)
        .is('clock_out', null)
        .limit(1)
        .maybeSingle();

      if (existing) {
        throw new Error('Already clocked in. Please clock out first.');
      }

      const { data, error } = await supabase
        .from('time_clock_entries')
        .insert({
          studio_id: ctx.studioId,
          staff_id: ctx.staffId,
          clock_in: new Date().toISOString(),
          notes: input?.notes ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Clock out */
  clockOut: instructorProcedure
    .input(z.object({ notes: z.string().max(500).optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: entry } = await supabase
        .from('time_clock_entries')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('staff_id', ctx.staffId)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!entry) {
        throw new Error('Not currently clocked in.');
      }

      const clockOut = new Date();
      const clockIn = new Date(entry.clock_in);
      const durationMinutes = Math.round((clockOut.getTime() - clockIn.getTime()) / 60000);

      const updates: Record<string, unknown> = {
        clock_out: clockOut.toISOString(),
        duration_minutes: durationMinutes,
      };
      if (input?.notes) updates.notes = input.notes;

      const { data, error } = await supabase
        .from('time_clock_entries')
        .update(updates)
        .eq('id', entry.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** My entries with date filtering */
  myEntries: instructorProcedure
    .input(z.object({
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('time_clock_entries')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('staff_id', ctx.staffId)
        .order('clock_in', { ascending: false });

      if (input?.startDate) query = query.gte('clock_in', input.startDate);
      if (input?.endDate) query = query.lte('clock_in', input.endDate + 'T23:59:59Z');

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data ?? [];
    }),

  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** All staff entries with filters */
  allEntries: adminProcedure
    .input(z.object({
      staffId: z.string().uuid().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('time_clock_entries')
        .select('*, staff(display_name, email, role)')
        .eq('studio_id', ctx.studioId)
        .order('clock_in', { ascending: false });

      if (input?.staffId) query = query.eq('staff_id', input.staffId);
      if (input?.startDate) query = query.gte('clock_in', input.startDate);
      if (input?.endDate) query = query.lte('clock_in', input.endDate + 'T23:59:59Z');

      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data ?? [];
    }),

  /** Edit entry (admin correction) */
  editEntry: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      clock_in: z.string().optional(),
      clock_out: z.string().nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      // Recalculate duration if both times provided
      if (updates.clock_in && updates.clock_out) {
        const dur = Math.round(
          (new Date(updates.clock_out).getTime() - new Date(updates.clock_in).getTime()) / 60000
        );
        (updates as Record<string, unknown>).duration_minutes = dur;
      } else if (updates.clock_out === null) {
        (updates as Record<string, unknown>).duration_minutes = null;
      }

      const { data, error } = await supabase
        .from('time_clock_entries')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select('*, staff(display_name, email, role)')
        .single();

      if (error) throw error;
      return data;
    }),

  /** Delete entry */
  deleteEntry: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('time_clock_entries')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  /** Summary: hours per staff for date range */
  summary: adminProcedure
    .input(z.object({
      startDate: z.string(),
      endDate: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('time_clock_entries')
        .select('staff_id, duration_minutes, staff(display_name, email, role)')
        .eq('studio_id', ctx.studioId)
        .gte('clock_in', input.startDate)
        .lte('clock_in', input.endDate + 'T23:59:59Z')
        .not('duration_minutes', 'is', null);

      if (error) throw error;

      // Aggregate by staff
      const staffMap = new Map<string, {
        staffId: string;
        displayName: string;
        email: string;
        role: string;
        totalMinutes: number;
        entryCount: number;
      }>();

      for (const entry of data ?? []) {
        const existing = staffMap.get(entry.staff_id);
        const staffInfo = entry.staff as unknown as { display_name: string; email: string; role: string } | null;
        if (existing) {
          existing.totalMinutes += entry.duration_minutes ?? 0;
          existing.entryCount++;
        } else {
          staffMap.set(entry.staff_id, {
            staffId: entry.staff_id,
            displayName: staffInfo?.display_name ?? 'Unknown',
            email: staffInfo?.email ?? '',
            role: staffInfo?.role ?? '',
            totalMinutes: entry.duration_minutes ?? 0,
            entryCount: 1,
          });
        }
      }

      return Array.from(staffMap.values()).sort((a, b) => b.totalMinutes - a.totalMinutes);
    }),
});
