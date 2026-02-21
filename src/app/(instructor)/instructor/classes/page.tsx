'use client';

import { trpc } from '@/lib/trpc';
import Link from 'next/link';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function InstructorClassesPage() {
  const classes = trpc.instructor.myClasses.useQuery();

  // Group by day
  const byDay = (classes.data ?? []).reduce<Record<number, typeof classes.data>>((acc, cls) => {
    const day = cls.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day]!.push(cls);
    return acc;
  }, {});

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">My Classes</h1>
        <p className="mt-1 text-sm text-gray-500">All classes assigned to you</p>
      </div>

      {classes.isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="skeleton h-5 w-32 mb-3" />
              <div className="skeleton h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {!classes.isLoading && (classes.data?.length ?? 0) === 0 && (
        <div className="glass-card rounded-2xl p-12 text-center">
          <p className="text-gray-500">No classes assigned to you yet.</p>
          <p className="mt-1 text-sm text-gray-400">Contact your studio director to be assigned to classes.</p>
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(byDay)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([day, dayClasses]) => (
            <div key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-400">
                {DAY_NAMES[Number(day)]}
              </h2>
              <div className="space-y-3">
                {(dayClasses ?? []).map((cls) => {
                  const classType = cls.class_types as unknown as { name: string; color: string } | null;
                  const level = cls.levels as unknown as { name: string } | null;
                  const season = cls.seasons as unknown as { name: string; is_current: boolean } | null;
                  return (
                    <Link
                      key={cls.id}
                      href={`/instructor/classes/${cls.id}`}
                      className="glass-card flex items-center justify-between rounded-2xl p-5 transition-colors hover:bg-indigo-50/40"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className="h-12 w-1.5 rounded-full"
                          style={{ backgroundColor: classType?.color ?? '#6366f1' }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{cls.name}</p>
                          <p className="text-sm text-gray-500">
                            {classType?.name}{level ? ` - ${level.name}` : ''}
                          </p>
                          {season && (
                            <p className="text-xs text-gray-400">
                              {season.name} {season.is_current ? '(Current)' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">
                          {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)}
                        </p>
                        <p className="text-xs text-gray-500">{cls.room ?? 'No room'}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {cls.enrolled_count}/{cls.capacity} enrolled
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
