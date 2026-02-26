import { adminProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const analyticsRouter = router({
  overview: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const sid = ctx.studioId;

    const [
      classesRes,
      enrollmentsRes,
      familiesRes,
      staffRes,
      activeEnrollRes,
      waitlistRes,
      paymentsRes,
      sessionsRes,
      attendanceRes,
    ] = await Promise.all([
      supabase.from('classes').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
      supabase.from('families').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
      supabase.from('staff').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('active', true),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('status', 'active'),
      supabase.from('enrollments').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('status', 'waitlisted'),
      supabase.from('payments').select('amount, status').eq('studio_id', sid).eq('status', 'succeeded'),
      supabase.from('class_sessions').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('status', 'completed'),
      supabase.from('attendance').select('status').eq('studio_id', sid),
    ]);

    // Revenue
    const totalRevenue = (paymentsRes.data ?? []).reduce((sum, p) => sum + p.amount, 0);

    // Attendance rate
    const attendanceRecords = attendanceRes.data ?? [];
    const totalAttendance = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late').length;
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      totalClasses: classesRes.count ?? 0,
      totalEnrollments: enrollmentsRes.count ?? 0,
      activeEnrollments: activeEnrollRes.count ?? 0,
      waitlistedCount: waitlistRes.count ?? 0,
      totalFamilies: familiesRes.count ?? 0,
      activeStaff: staffRes.count ?? 0,
      totalRevenue,
      completedSessions: sessionsRes.count ?? 0,
      attendanceRate,
    };
  }),

  classPopularity: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from('classes')
      .select('id, name, enrolled_count, capacity, class_types(name, color)')
      .eq('studio_id', ctx.studioId)
      .order('enrolled_count', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data ?? [];
  }),

  enrollmentsByType: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: classTypes } = await supabase
      .from('class_types')
      .select('id, name, color')
      .eq('studio_id', ctx.studioId)
      .eq('active', true);

    if (!classTypes || classTypes.length === 0) return [];

    const results = await Promise.all(
      classTypes.map(async (ct) => {
        const { data: classes } = await supabase
          .from('classes')
          .select('enrolled_count')
          .eq('studio_id', ctx.studioId)
          .eq('class_type_id', ct.id);

        const total = (classes ?? []).reduce((sum, c) => sum + c.enrolled_count, 0);
        return { name: ct.name, color: ct.color, count: total };
      })
    );

    return results.sort((a, b) => b.count - a.count);
  }),

  revenueByMonth: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: payments } = await supabase
      .from('payments')
      .select('amount, created_at')
      .eq('studio_id', ctx.studioId)
      .eq('status', 'succeeded')
      .order('created_at', { ascending: true });

    if (!payments || payments.length === 0) return [];

    const byMonth: Record<string, number> = {};
    for (const p of payments) {
      const month = p.created_at.slice(0, 7); // YYYY-MM
      byMonth[month] = (byMonth[month] ?? 0) + p.amount;
    }

    return Object.entries(byMonth).map(([month, amount]) => ({ month, amount }));
  }),
});
