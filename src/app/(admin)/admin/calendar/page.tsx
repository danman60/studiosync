'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Clock, MapPin, Users, Calendar } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function CalendarPage() {
  const { data: classes, isLoading } = trpc.admin.listClasses.useQuery();

  const classesByDay = useMemo(() => {
    const byDay: Record<number, typeof classes> = {};
    for (let d = 0; d < 7; d++) byDay[d] = [];
    for (const cls of classes ?? []) {
      byDay[cls.day_of_week]?.push(cls);
    }
    for (const d of Object.keys(byDay)) {
      byDay[Number(d)]?.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return byDay;
  }, [classes]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Weekly Calendar</h1>
        <p className="mt-1 text-sm text-stone-500">All classes organized by day and time.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card-static rounded-2xl p-5">
              <div className="mb-3 skeleton h-5 w-24" />
              <div className="space-y-3">
                <div className="skeleton h-16 w-full rounded-xl" />
                <div className="skeleton h-16 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {DAYS.map((dayName, dayIdx) => {
            const dayClasses = classesByDay[dayIdx] ?? [];
            if (dayClasses.length === 0) return null;

            return (
              <div key={dayIdx} className="glass-card-static rounded-2xl p-5">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 text-xs font-bold text-primary">
                    {SHORT_DAYS[dayIdx]}
                  </span>
                  <h2 className="text-sm font-semibold text-stone-800">{dayName}</h2>
                  <span className="ml-auto rounded-full bg-stone-100 px-2 py-0.5 text-xs font-medium text-stone-500">
                    {dayClasses.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {dayClasses.map((cls) => {
                    const classType = cls.class_types as { name: string; color: string } | null;
                    const instructor = cls.staff as { id: string; display_name: string } | null;
                    const color = classType?.color ?? '#C2785C';

                    return (
                      <div
                        key={cls.id}
                        className="group rounded-xl border border-stone-100 p-3 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md hover:shadow-primary/5"
                        style={{ borderLeftWidth: 3, borderLeftColor: color }}
                      >
                        <p className="text-sm font-medium text-stone-800">{cls.name}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(cls.start_time)} - {formatTime(cls.end_time)}
                          </span>
                          {cls.room && (
                            <span className="inline-flex items-center gap-1">
                              <MapPin size={12} />
                              {cls.room}
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1">
                            <Users size={12} />
                            {cls.enrolled_count}/{cls.capacity}
                          </span>
                        </div>
                        {instructor && (
                          <p className="mt-1 text-xs text-stone-400">{instructor.display_name}</p>
                        )}
                        {classType && (
                          <span
                            className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: `${color}20`,
                              color: color,
                              border: `1px solid ${color}30`,
                            }}
                          >
                            {classType.name}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (classes ?? []).length === 0 && (
        <div className="empty-state">
          <Calendar size={24} className="mb-3 text-primary-light" />
          <p className="text-sm font-medium text-stone-600">No classes scheduled</p>
          <p className="mt-1 text-xs text-stone-400">Create classes to see them on the calendar.</p>
        </div>
      )}
    </div>
  );
}
