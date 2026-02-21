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

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
};

function ShimmerCards() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="glass-card rounded-2xl p-6">
          <div className="skeleton h-10 w-10 rounded-xl mb-3" />
          <div className="skeleton h-6 w-16 mb-1" />
          <div className="skeleton h-4 w-24" />
        </div>
      ))}
    </div>
  );
}

export default function ParentDashboardPage() {
  const dashboard = trpc.portal.dashboardData.useQuery();

  if (dashboard.isLoading) {
    return (
      <div>
        <div className="skeleton h-8 w-48 mb-2" />
        <div className="skeleton h-4 w-64 mb-8" />
        <ShimmerCards />
      </div>
    );
  }

  const d = dashboard.data;

  if (!d?.family) {
    return (
      <div className="glass-card flex flex-col items-center rounded-2xl p-10 text-center animate-fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
          <Users size={32} className="text-indigo-600" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-900">No family account found</h2>
        <p className="mt-2 text-sm text-gray-600">
          Register for a class to create your family profile.
        </p>
        <Link
          href="/classes"
          className="btn-gradient mt-5 inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium"
        >
          Browse Classes
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">
          Welcome, {d.family.parent_first_name}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Here&apos;s an overview of your family&apos;s activity.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6 animate-fade-in-up stagger-1">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <Users size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{d.children.length}</p>
            <p className="text-sm text-gray-500">Children</p>
          </div>
        </div>
        <div className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{d.enrollments.length}</p>
            <p className="text-sm text-gray-500">Active Enrollments</p>
          </div>
        </div>
        <Link
          href="/classes"
          className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 animate-fade-in-up stagger-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
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
              <div key={en.id} className="glass-card flex items-center justify-between rounded-2xl px-6 py-4">
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
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
