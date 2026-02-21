'use client';

import { trpc } from '@/lib/trpc';
import { CheckSquare, Calendar } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  absent: 'bg-red-500/15 text-red-600 border border-red-500/25',
  late: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  excused: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
};

export default function ParentAttendancePage() {
  const { data: attendance, isLoading } = trpc.portal.childAttendance.useQuery();

  // Group by child
  const byChild = new Map<string, { childName: string; records: typeof attendance }>();
  for (const rec of attendance ?? []) {
    const child = rec.children as unknown as { first_name: string; last_name: string } | null;
    if (!child) continue;
    const key = rec.child_id;
    const name = `${child.first_name} ${child.last_name}`;
    if (!byChild.has(key)) byChild.set(key, { childName: name, records: [] });
    byChild.get(key)!.records!.push(rec);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Attendance</h1>
        <p className="mt-1 text-sm text-gray-500">View your children&apos;s attendance records.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/60 bg-white/80 p-5">
              <div className="mb-2 h-5 w-32 rounded bg-gray-200/60" />
              <div className="h-4 w-48 rounded bg-gray-200/40" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && byChild.size === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-20">
          <CheckSquare size={24} className="mb-3 text-indigo-400" />
          <p className="text-sm font-medium text-gray-600">No attendance records yet</p>
          <p className="mt-1 text-xs text-gray-400">Attendance will appear here once classes begin.</p>
        </div>
      )}

      {!isLoading && byChild.size > 0 && (
        <div className="space-y-8">
          {Array.from(byChild.entries()).map(([childId, { childName, records }]) => (
            <div key={childId}>
              <h2 className="mb-3 text-base font-semibold text-gray-900">{childName}</h2>
              <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(records ?? []).map((rec) => {
                      const session = rec.class_sessions as unknown as {
                        session_date: string;
                        classes: { name: string } | null;
                      } | null;
                      return (
                        <tr key={rec.id} className="border-b border-gray-50 transition-colors hover:bg-indigo-50/30">
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              {session?.session_date ?? '—'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {session?.classes?.name ?? '—'}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[rec.status] ?? ''}`}>
                              {rec.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
