'use client';

import { trpc } from '@/lib/trpc';
import {
  BookOpen,
  DollarSign,
  TrendingUp,
  Users,
  UserCheck,
  Clock,
  BarChart3,
  Activity,
} from 'lucide-react';

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AnalyticsPage() {
  const { data: overview, isLoading: loadingOverview } = trpc.analytics.overview.useQuery();
  const { data: popularity, isLoading: loadingPop } = trpc.analytics.classPopularity.useQuery();
  const { data: byType } = trpc.analytics.enrollmentsByType.useQuery();
  const { data: revenue } = trpc.analytics.revenueByMonth.useQuery();

  const isLoading = loadingOverview;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">Studio performance and enrollment insights.</p>
      </div>

      {/* KPI Cards */}
      {isLoading ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="mb-3 skeleton h-4 w-20" />
              <div className="skeleton h-8 w-16" />
            </div>
          ))}
        </div>
      ) : overview ? (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            icon={<BookOpen size={20} />}
            label="Total Classes"
            value={String(overview.totalClasses)}
            gradient="from-indigo-500/10 to-indigo-500/5"
            iconColor="text-indigo-600"
            stagger={1}
          />
          <KpiCard
            icon={<Users size={20} />}
            label="Active Enrollments"
            value={String(overview.activeEnrollments)}
            subtitle={`${overview.waitlistedCount} waitlisted`}
            gradient="from-purple-500/10 to-purple-500/5"
            iconColor="text-purple-600"
            stagger={2}
          />
          <KpiCard
            icon={<UserCheck size={20} />}
            label="Families"
            value={String(overview.totalFamilies)}
            subtitle={`${overview.activeStaff} staff`}
            gradient="from-emerald-500/10 to-emerald-500/5"
            iconColor="text-emerald-600"
            stagger={3}
          />
          <KpiCard
            icon={<DollarSign size={20} />}
            label="Total Revenue"
            value={formatCents(overview.totalRevenue)}
            gradient="from-amber-500/10 to-amber-500/5"
            iconColor="text-amber-600"
            stagger={4}
          />
          <KpiCard
            icon={<TrendingUp size={20} />}
            label="Total Enrollments"
            value={String(overview.totalEnrollments)}
            gradient="from-blue-500/10 to-blue-500/5"
            iconColor="text-blue-600"
            stagger={5}
          />
          <KpiCard
            icon={<Clock size={20} />}
            label="Completed Sessions"
            value={String(overview.completedSessions)}
            gradient="from-cyan-500/10 to-cyan-500/5"
            iconColor="text-cyan-600"
            stagger={6}
          />
          <KpiCard
            icon={<Activity size={20} />}
            label="Attendance Rate"
            value={`${overview.attendanceRate}%`}
            gradient="from-rose-500/10 to-rose-500/5"
            iconColor="text-rose-600"
            stagger={7}
          />
          <KpiCard
            icon={<BarChart3 size={20} />}
            label="Active Staff"
            value={String(overview.activeStaff)}
            gradient="from-violet-500/10 to-violet-500/5"
            iconColor="text-violet-600"
            stagger={8}
          />
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Class Popularity */}
        <div className="glass-card-static rounded-2xl p-6">
          <h2 className="section-heading text-sm mb-4"><BarChart3 size={16} /> Most Popular Classes</h2>
          {loadingPop ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="skeleton h-8 w-full" />
              ))}
            </div>
          ) : (popularity ?? []).length > 0 ? (
            <div className="space-y-3">
              {(popularity ?? []).map((cls) => {
                const classType = cls.class_types as unknown as { name: string; color: string } | null;
                const pct = cls.capacity > 0 ? Math.round((cls.enrolled_count / cls.capacity) * 100) : 0;
                const color = classType?.color ?? '#6366f1';

                return (
                  <div key={cls.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="truncate text-sm font-medium text-gray-700">{cls.name}</span>
                        <span className="shrink-0 text-xs text-gray-400">
                          {cls.enrolled_count}/{cls.capacity}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-gray-500 w-10 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No class data available.</p>
          )}
        </div>

        {/* Enrollments by Type */}
        <div className="glass-card-static rounded-2xl p-6">
          <h2 className="section-heading text-sm mb-4"><Users size={16} /> Enrollments by Class Type</h2>
          {(byType ?? []).length > 0 ? (
            <div className="space-y-3">
              {(byType ?? []).map((ct) => {
                const maxCount = Math.max(...(byType ?? []).map((t) => t.count), 1);
                const pct = Math.round((ct.count / maxCount) * 100);
                return (
                  <div key={ct.name} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: ct.color }}
                          />
                          <span className="text-sm font-medium text-gray-700">{ct.name}</span>
                        </div>
                        <span className="text-xs text-gray-400">{ct.count} enrolled</span>
                      </div>
                      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: ct.color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No enrollment data available.</p>
          )}
        </div>

        {/* Revenue by Month */}
        <div className="glass-card-static rounded-2xl p-6 lg:col-span-2">
          <h2 className="section-heading text-sm mb-4"><DollarSign size={16} /> Revenue by Month</h2>
          {(revenue ?? []).length > 0 ? (
            <div className="flex items-end gap-2" style={{ height: 160 }}>
              {(revenue ?? []).map((r) => {
                const maxAmt = Math.max(...(revenue ?? []).map((x) => x.amount), 1);
                const pct = Math.round((r.amount / maxAmt) * 100);
                return (
                  <div key={r.month} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-[10px] text-gray-400">{formatCents(r.amount)}</span>
                    <div
                      className="w-full rounded-t-lg bg-gradient-to-t from-indigo-500 to-purple-400 transition-all duration-500"
                      style={{ height: `${Math.max(pct, 4)}%` }}
                    />
                    <span className="text-[10px] text-gray-500">{r.month.slice(5)}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400">No revenue data yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  subtitle,
  gradient,
  iconColor,
  stagger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  gradient: string;
  iconColor: string;
  stagger: number;
}) {
  return (
    <div className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(stagger, 8)}`}>
      <div className="mb-3 flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${gradient}`}>
          <span className={iconColor}>{icon}</span>
        </div>
        <span className="text-xs font-medium text-gray-500">{label}</span>
      </div>
      <p className="stat-number">{value}</p>
      {subtitle && <p className="mt-0.5 text-xs text-gray-400">{subtitle}</p>}
    </div>
  );
}
