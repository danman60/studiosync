'use client';

import { trpc } from '@/lib/trpc';
import { BookOpen, Users, Clock } from 'lucide-react';
import Link from 'next/link';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  waitlisted: 'bg-blue-100 text-blue-700',
};

export default function ParentDashboardPage() {
  const dashboard = trpc.portal.dashboardData.useQuery();

  if (dashboard.isLoading) {
    return <p className="text-sm text-gray-400">Loading...</p>;
  }

  const d = dashboard.data;

  if (!d?.family) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <Users size={40} className="mx-auto text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900">No family account found</h2>
        <p className="mt-2 text-sm text-gray-600">
          Register for a class to create your family profile.
        </p>
        <Link
          href="/classes"
          className="mt-4 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Browse Classes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">
        Welcome, {d.family.parent_first_name}
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        Here&apos;s an overview of your family&apos;s activity.
      </p>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{d.children.length}</p>
            <p className="text-sm text-gray-500">Children</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{d.enrollments.length}</p>
            <p className="text-sm text-gray-500">Active Enrollments</p>
          </div>
        </div>
        <Link
          href="/classes"
          className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 transition-shadow hover:shadow-md"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-indigo-600">Browse Classes</p>
            <p className="text-xs text-gray-500">Register for more</p>
          </div>
        </Link>
      </div>

      {/* Enrollments */}
      <h2 className="mt-8 text-lg font-semibold text-gray-900">Current Enrollments</h2>
      {d.enrollments.length === 0 ? (
        <p className="mt-3 text-sm text-gray-400">No active enrollments.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {d.enrollments.map((en) => {
            const child = en.children as unknown as { first_name: string; last_name: string } | null;
            const cls = en.classes as unknown as {
              name: string; day_of_week: number; start_time: string; end_time: string;
              room: string | null; class_types: { name: string; color: string } | null;
              staff: { display_name: string } | null;
            } | null;

            return (
              <div key={en.id} className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4">
                <div className="flex items-center gap-4">
                  {cls?.class_types && (
                    <span
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: cls.class_types.color }}
                    >
                      {cls.class_types.name}
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{cls?.name ?? '—'}</p>
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} />
                      {cls ? `${DAYS[cls.day_of_week]} ${formatTime(cls.start_time)}–${formatTime(cls.end_time)}` : '—'}
                      {cls?.room && ` / ${cls.room}`}
                      {cls?.staff && ` / ${cls.staff.display_name}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">
                    {child ? `${child.first_name} ${child.last_name}` : '—'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {en.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
