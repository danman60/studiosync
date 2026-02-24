'use client';

import { trpc } from '@/lib/trpc';
import { BookOpen, CheckSquare, Users } from 'lucide-react';
import Link from 'next/link';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function InstructorDashboardPage() {
  const classes = trpc.instructor.myClasses.useQuery();

  const todayDow = new Date().getDay();
  const todayClasses = (classes.data ?? []).filter((c) => c.day_of_week === todayDow);
  const totalStudents = (classes.data ?? []).reduce((sum, c) => sum + (c.enrolled_count ?? 0), 0);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">
          Instructor Dashboard
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/instructor/classes"
          className="glass-card flex items-center gap-4 rounded-2xl bg-primary-50 p-6 animate-fade-in-up stagger-1"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary">
            <BookOpen size={22} />
          </div>
          <div>
            {classes.isLoading ? (
              <div className="skeleton h-7 w-12 mb-1" />
            ) : (
              <p className="stat-number">{classes.data?.length ?? 0}</p>
            )}
            <p className="text-sm text-stone-500">My Classes</p>
          </div>
        </Link>

        <div className="glass-card flex items-center gap-4 rounded-2xl p-6 animate-fade-in-up stagger-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Users size={22} />
          </div>
          <div>
            {classes.isLoading ? (
              <div className="skeleton h-7 w-12 mb-1" />
            ) : (
              <p className="stat-number">{totalStudents}</p>
            )}
            <p className="text-sm text-stone-500">Total Students</p>
          </div>
        </div>

        <div className="glass-card flex items-center gap-4 rounded-2xl p-6 animate-fade-in-up stagger-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <CheckSquare size={22} />
          </div>
          <div>
            {classes.isLoading ? (
              <div className="skeleton h-7 w-12 mb-1" />
            ) : (
              <p className="stat-number">{todayClasses.length}</p>
            )}
            <p className="text-sm text-stone-500">Today&apos;s Classes</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <div className="mt-8">
        <h2 className="section-heading text-sm"><CheckSquare size={16} /> Today&apos;s Schedule</h2>
        <div className="mt-3 space-y-3">
          {classes.isLoading && (
            <div className="glass-card-static rounded-2xl p-6">
              <div className="skeleton h-5 w-48 mb-2" />
              <div className="skeleton h-4 w-32" />
            </div>
          )}
          {!classes.isLoading && todayClasses.length === 0 && (
            <div className="glass-card-static rounded-2xl p-6 text-center text-sm text-stone-400">
              No classes scheduled today
            </div>
          )}
          {todayClasses.map((cls) => {
            const classType = cls.class_types as unknown as { name: string; color: string } | null;
            const level = cls.levels as unknown as { name: string } | null;
            return (
              <Link
                key={cls.id}
                href={`/instructor/classes/${cls.id}`}
                className="glass-card flex items-center justify-between rounded-2xl p-5"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="h-10 w-1.5 rounded-full"
                    style={{ backgroundColor: classType?.color ?? '#C2785C' }}
                  />
                  <div>
                    <p className="font-medium text-stone-800">{cls.name}</p>
                    <p className="text-sm text-stone-500">
                      {classType?.name}{level ? ` - ${level.name}` : ''} | {cls.room ?? 'No room'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-stone-800">
                    {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                  </p>
                  <p className="text-xs text-stone-500">{cls.enrolled_count} students</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All Classes */}
      {!classes.isLoading && (classes.data?.length ?? 0) > 0 && (
        <div className="mt-8">
          <h2 className="section-heading text-sm"><BookOpen size={16} /> Weekly Schedule</h2>
          <div className="mt-3 glass-card-static overflow-hidden rounded-2xl">
            <table className="min-w-full divide-y divide-stone-100">
              <thead>
                <tr className="bg-stone-50/60">
                  <th className="table-header">Class</th>
                  <th className="table-header">Day</th>
                  <th className="table-header">Time</th>
                  <th className="table-header">Room</th>
                  <th className="table-header text-center">Students</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {(classes.data ?? []).map((cls) => {
                  const classType = cls.class_types as unknown as { name: string; color: string } | null;
                  return (
                    <tr key={cls.id} className="table-row-hover">
                      <td className="table-cell">
                        <Link href={`/instructor/classes/${cls.id}`} className="text-sm font-medium text-primary hover:text-primary-dark">
                          {cls.name}
                        </Link>
                        <p className="text-xs text-stone-500">{classType?.name}</p>
                      </td>
                      <td className="table-cell text-stone-600">{DAY_NAMES[cls.day_of_week]}</td>
                      <td className="table-cell text-stone-600">
                        {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                      </td>
                      <td className="table-cell text-stone-600">{cls.room ?? '—'}</td>
                      <td className="table-cell text-center text-stone-600">{cls.enrolled_count}/{cls.capacity}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
