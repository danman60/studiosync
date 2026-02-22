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
            <div key={i} className="glass-card-static rounded-2xl p-5">
              <div className="mb-2 skeleton h-5 w-32" />
              <div className="skeleton h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && byChild.size === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <CheckSquare size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No attendance records yet</p>
          <p className="mt-1 text-xs text-gray-400">Attendance will appear here once classes begin.</p>
        </div>
      )}

      {!isLoading && byChild.size > 0 && (
        <div className="space-y-8">
          {Array.from(byChild.entries()).map(([childId, { childName, records }]) => (
            <div key={childId}>
              <h2 className="section-heading text-sm mb-3"><CheckSquare size={16} /> {childName}</h2>
              <div className="glass-card-static overflow-hidden rounded-2xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="table-header">Date</th>
                      <th className="table-header">Class</th>
                      <th className="table-header text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(records ?? []).map((rec) => {
                      const session = rec.class_sessions as unknown as {
                        session_date: string;
                        classes: { name: string } | null;
                      } | null;
                      return (
                        <tr key={rec.id} className="table-row-hover">
                          <td className="table-cell text-gray-700">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} className="text-gray-400" />
                              {session?.session_date ?? '—'}
                            </span>
                          </td>
                          <td className="table-cell text-gray-700">
                            {session?.classes?.name ?? '—'}
                          </td>
                          <td className="table-cell text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[rec.status] ?? ''}`}>
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
