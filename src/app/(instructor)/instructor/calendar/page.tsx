'use client';

import { useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { Clock, MapPin, Calendar } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(t: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function InstructorCalendarPage() {
  const { data: classes, isLoading } = trpc.instructor.myClasses.useQuery();

  const byDay = useMemo(() => {
    const map: Record<number, typeof classes> = {};
    for (const cls of classes ?? []) {
      const d = cls.day_of_week ?? 0;
      if (!map[d]) map[d] = [];
      map[d]!.push(cls);
    }
    for (const d of Object.keys(map)) {
      map[Number(d)]!.sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''));
    }
    return map;
  }, [classes]);

  const activeDays = Object.keys(byDay).map(Number).sort();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">My Calendar</h1>
        <p className="mt-1 text-sm text-stone-500">Weekly class schedule overview.</p>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-static rounded-2xl p-5">
              <div className="mb-3 skeleton h-5 w-24" />
              <div className="skeleton h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && activeDays.length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Calendar size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No classes assigned</p>
          <p className="mt-1 text-xs text-stone-400">Your class schedule will appear here.</p>
        </div>
      )}

      {!isLoading && activeDays.length > 0 && (
        <div className="space-y-6">
          {activeDays.map((day) => (
            <div key={day}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-stone-400">
                {DAYS[day]}
              </h2>
              <div className="space-y-2">
                {(byDay[day] ?? []).map((cls) => {
                  const ct = cls.class_types as unknown as { name: string; color: string } | null;
                  const season = cls.seasons as unknown as { name: string; is_current: boolean } | null;
                  return (
                    <div
                      key={cls.id}
                      className="glass-card rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-stone-800">{cls.name}</h3>
                            {ct && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-medium"
                                style={{ backgroundColor: `${ct.color}20`, color: ct.color, border: `1px solid ${ct.color}30` }}
                              >
                                {ct.name}
                              </span>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                            </span>
                            {cls.room && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin size={12} /> {cls.room}
                              </span>
                            )}
                          </div>
                        </div>
                        {season && (
                          <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            season.is_current
                              ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                              : 'bg-stone-500/15 text-stone-500 border border-stone-500/20'
                          }`}>
                            {season.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
