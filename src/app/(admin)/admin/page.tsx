'use client';

import { trpc } from '@/lib/trpc';
import { BookOpen, Users, UserPlus, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const STAT_CARDS = [
  { key: 'totalClasses', label: 'Total Classes', icon: BookOpen, href: '/admin/classes', gradient: 'from-indigo-500/10 to-indigo-600/5', iconBg: 'bg-indigo-100 text-indigo-600' },
  { key: 'activeEnrollments', label: 'Active Enrollments', icon: UserPlus, href: '/admin/enrollments', gradient: 'from-emerald-500/10 to-emerald-600/5', iconBg: 'bg-emerald-100 text-emerald-600' },
  { key: 'totalFamilies', label: 'Families', icon: Users, href: '/admin/families', gradient: 'from-amber-500/10 to-amber-600/5', iconBg: 'bg-amber-100 text-amber-600' },
  { key: 'activeStaff', label: 'Active Staff', icon: GraduationCap, href: '/admin/staff', gradient: 'from-purple-500/10 to-purple-600/5', iconBg: 'bg-purple-100 text-purple-600' },
] as const;

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

function ShimmerRow() {
  return (
    <tr>
      {[...Array(4)].map((_, i) => (
        <td key={i} className="px-5 py-4"><div className="skeleton h-4 w-24" /></td>
      ))}
    </tr>
  );
}

export default function AdminDashboardPage() {
  const stats = trpc.admin.dashboardStats.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Studio overview at a glance</p>
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
              className={`glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br ${card.gradient} p-6 animate-fade-in-up stagger-${i + 1}`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.iconBg}`}>
                <Icon size={22} />
              </div>
              <div>
                {stats.isLoading ? (
                  <div className="skeleton h-7 w-12 mb-1" />
                ) : (
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                )}
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Enrollments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
        <div className="mt-3 glass-card overflow-x-auto rounded-2xl">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Child', 'Class', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {stats.isLoading && (
                <>
                  <ShimmerRow />
                  <ShimmerRow />
                  <ShimmerRow />
                </>
              )}
              {stats.data?.recentEnrollments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No enrollments yet</td>
                </tr>
              )}
              {stats.data?.recentEnrollments.map((e) => {
                const rawChild = e.children as unknown;
                const child = (Array.isArray(rawChild) ? rawChild[0] : rawChild) as { first_name: string; last_name: string } | null;
                const rawCls = e.classes as unknown;
                const cls = (Array.isArray(rawCls) ? rawCls[0] : rawCls) as { name: string } | null;
                return (
                  <tr key={e.id} className="transition-colors hover:bg-indigo-50/40">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {child ? `${child.first_name} ${child.last_name}` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{cls?.name ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500">
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
