'use client';

import { trpc } from '@/lib/trpc';
import { BookOpen, Users, UserPlus, GraduationCap } from 'lucide-react';
import Link from 'next/link';

const STAT_CARDS = [
  { key: 'totalClasses', label: 'Total Classes', icon: BookOpen, href: '/admin/classes', color: 'bg-indigo-50 text-indigo-600' },
  { key: 'activeEnrollments', label: 'Active Enrollments', icon: UserPlus, href: '/admin/enrollments', color: 'bg-emerald-50 text-emerald-600' },
  { key: 'totalFamilies', label: 'Families', icon: Users, href: '/admin/families', color: 'bg-amber-50 text-amber-600' },
  { key: 'activeStaff', label: 'Active Staff', icon: GraduationCap, href: '/admin/staff', color: 'bg-purple-50 text-purple-600' },
] as const;

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

export default function AdminDashboardPage() {
  const stats = trpc.admin.dashboardStats.useQuery();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-600">Studio overview at a glance</p>

      {/* Stat Cards */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const value = stats.data?.[card.key] ?? '—';
          return (
            <Link
              key={card.key}
              href={card.href}
              className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${card.color}`}>
                <Icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-sm text-gray-500">{card.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Recent Enrollments */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900">Recent Enrollments</h2>
        <div className="mt-3 overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Child', 'Class', 'Status', 'Date'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats.isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">Loading...</td>
                </tr>
              )}
              {stats.data?.recentEnrollments.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-400">No enrollments yet</td>
                </tr>
              )}
              {stats.data?.recentEnrollments.map((e) => {
                const rawChild = e.children as unknown;
                const child = (Array.isArray(rawChild) ? rawChild[0] : rawChild) as { first_name: string; last_name: string } | null;
                const rawCls = e.classes as unknown;
                const cls = (Array.isArray(rawCls) ? rawCls[0] : rawCls) as { name: string } | null;
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {child ? `${child.first_name} ${child.last_name}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{cls?.name ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[e.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
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
