'use client';

import { useState, useCallback, useSyncExternalStore } from 'react';
import { trpc } from '@/lib/trpc';
import { Clock, LogIn, LogOut } from 'lucide-react';

/** Returns a number that increments every `ms` milliseconds (for re-render triggers) */
function useInterval(ms: number, enabled: boolean) {
  const subscribe = useCallback((cb: () => void) => {
    if (!enabled) return () => {};
    const id = setInterval(cb, ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
  return useSyncExternalStore(subscribe, () => Date.now(), () => Date.now());
}

function formatDuration(minutes: number | null): string {
  if (minutes == null) return '—';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit',
  });
}

export default function InstructorTimeClockPage() {
  const [notes, setNotes] = useState('');
  const utils = trpc.useUtils();

  const status = trpc.timeClock.currentStatus.useQuery();
  const entries = trpc.timeClock.myEntries.useQuery();

  const clockInMut = trpc.timeClock.clockIn.useMutation({
    onSuccess: () => {
      utils.timeClock.currentStatus.invalidate();
      utils.timeClock.myEntries.invalidate();
      setNotes('');
    },
  });

  const clockOutMut = trpc.timeClock.clockOut.useMutation({
    onSuccess: () => {
      utils.timeClock.currentStatus.invalidate();
      utils.timeClock.myEntries.invalidate();
      setNotes('');
    },
  });

  const isClockedIn = !!status.data;
  const isPending = clockInMut.isPending || clockOutMut.isPending;

  // Re-render every minute to update elapsed time
  const currentTime = useInterval(60000, isClockedIn);
  const elapsed = isClockedIn && status.data
    ? Math.round((currentTime - new Date(status.data.clock_in).getTime()) / 60000)
    : 0;

  // This week's total
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const weekTotal = (entries.data ?? [])
    .filter(e => new Date(e.clock_in) >= weekStart && e.duration_minutes != null)
    .reduce((sum, e) => sum + (e.duration_minutes ?? 0), 0);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Time Clock</h1>

      {/* Clock In/Out Card */}
      <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm p-6 mb-6">
        <div className="text-center mb-6">
          <div className={`inline-flex items-center justify-center h-20 w-20 rounded-full mb-3 ${
            isClockedIn
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-gray-100 text-gray-400'
          }`}>
            <Clock size={36} />
          </div>

          {isClockedIn ? (
            <>
              <p className="text-lg font-semibold text-gray-900">Currently Clocked In</p>
              <p className="text-sm text-gray-500 mt-1">
                Since {formatDateTime(status.data!.clock_in)}
              </p>
              <p className="text-2xl font-bold text-emerald-600 mt-2">
                {formatDuration(elapsed)}
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-semibold text-gray-900">Not Clocked In</p>
              <p className="text-sm text-gray-400 mt-1">Tap the button below to start</p>
            </>
          )}
        </div>

        <div className="space-y-3">
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Optional notes..."
            className="input-field w-full"
            rows={2}
          />

          {isClockedIn ? (
            <button
              onClick={() => clockOutMut.mutate(notes ? { notes } : undefined)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-red-600 transition-colors disabled:opacity-50"
            >
              <LogOut size={18} />
              {isPending ? 'Clocking out...' : 'Clock Out'}
            </button>
          ) : (
            <button
              onClick={() => clockInMut.mutate(notes ? { notes } : undefined)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600 transition-colors disabled:opacity-50"
            >
              <LogIn size={18} />
              {isPending ? 'Clocking in...' : 'Clock In'}
            </button>
          )}
        </div>

        {(clockInMut.error || clockOutMut.error) && (
          <p className="mt-3 text-sm text-red-500 text-center">
            {clockInMut.error?.message || clockOutMut.error?.message}
          </p>
        )}
      </div>

      {/* This Week Summary */}
      <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm p-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-500">This Week</span>
          <span className="text-lg font-bold text-gray-900">
            {(weekTotal / 60).toFixed(1)}h
          </span>
        </div>
      </div>

      {/* Recent Entries */}
      <div className="rounded-2xl bg-white border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Recent Entries</h2>
        </div>
        {(entries.data ?? []).length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">No entries yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {(entries.data ?? []).slice(0, 20).map(entry => (
              <div key={entry.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDateTime(entry.clock_in)}
                  </p>
                  {entry.clock_out && (
                    <p className="text-xs text-gray-400">
                      to {formatDateTime(entry.clock_out)}
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-xs text-gray-400 mt-0.5">{entry.notes}</p>
                  )}
                </div>
                <div className="text-right">
                  {entry.clock_out ? (
                    <span className="text-sm font-semibold text-gray-700">
                      {formatDuration(entry.duration_minutes)}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Active
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
