'use client';

import { trpc } from '@/lib/trpc';
import { BookOpen, Users, UserPlus, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const STAT_CARDS = [
  { key: 'totalClasses', label: 'Total Classes', icon: BookOpen, href: '/admin/classes', iconBg: 'bg-primary-50 text-primary' },
  { key: 'activeEnrollments', label: 'Active Enrollments', icon: UserPlus, href: '/admin/enrollments', iconBg: 'bg-emerald-100 text-emerald-600' },
  { key: 'totalFamilies', label: 'Families', icon: Users, href: '/admin/families', iconBg: 'bg-amber-100 text-amber-600' },
  { key: 'activeStaff', label: 'Active Staff', icon: GraduationCap, href: '/admin/staff', iconBg: 'bg-primary-50 text-primary' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-stone-500/15 text-stone-500 border border-stone-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

export default function AdminDashboardPage() {
  const stats = trpc.admin.dashboardStats.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Dashboard</h1>
        <p className="mt-1 text-sm text-stone-500">Studio overview at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card, i) => {
          const Icon = card.icon;
          const value = stats.data?.[card.key] ?? '—';
          return (
            <Link
              key={card.key}
              href={card.href}
              className={`glass-card flex items-center gap-4 rounded-2xl p-6 animate-fade-in-up stagger-${i + 1}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg} shadow-sm`}>
                <Icon size={22} />
              </div>
              <div>
                {stats.isLoading ? (
                  <div className="skeleton h-7 w-14 mb-1" />
                ) : (
                  <p className="stat-number">{value}</p>
                )}
                <p className="mt-0.5 text-sm text-stone-500">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Enrollments */}
      <div className="mt-8">
        <h2 className="section-heading mb-3">Recent Enrollments</h2>
        <div className="glass-card-static overflow-hidden rounded-2xl">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Student', 'Class', 'Status', 'Date'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {stats.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
              {stats.data?.recentEnrollments.length === 0 && (
                <tr>
                  <td colSpan={4} className="table-cell text-center py-10 text-stone-400">No enrollments yet</td>
                </tr>
              )}
              {stats.data?.recentEnrollments.map((e) => {
                const rawStudent = e.students as unknown;
                const student = (Array.isArray(rawStudent) ? rawStudent[0] : rawStudent) as { first_name: string; last_name: string } | null;
                const rawCls = e.classes as unknown;
                const cls = (Array.isArray(rawCls) ? rawCls[0] : rawCls) as { name: string } | null;
                return (
                  <tr key={e.id} className="table-row-hover">
                    <td className="table-cell font-medium text-stone-800">
                      {student ? `${student.first_name} ${student.last_name}` : '—'}
                    </td>
                    <td className="table-cell text-stone-600">{cls?.name ?? '—'}</td>
                    <td className="table-cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[e.status] ?? 'bg-stone-100 text-stone-600'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="table-cell text-stone-500">
                      {new Date(e.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
