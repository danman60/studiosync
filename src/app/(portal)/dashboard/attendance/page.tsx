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
  const { data: attendance, isLoading } = trpc.portal.studentAttendance.useQuery();

  // Group by student
  const byStudent = new Map<string, { studentName: string; records: typeof attendance }>();
  for (const rec of attendance ?? []) {
    const student = rec.students as unknown as { first_name: string; last_name: string } | null;
    if (!student) continue;
    const key = rec.student_id;
    const name = `${student.first_name} ${student.last_name}`;
    if (!byStudent.has(key)) byStudent.set(key, { studentName: name, records: [] });
    byStudent.get(key)!.records!.push(rec);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Attendance</h1>
        <p className="mt-1 text-sm text-stone-500">View your students&apos; attendance records.</p>
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

      {!isLoading && byStudent.size === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <CheckSquare size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No attendance records yet</p>
          <p className="mt-1 text-xs text-stone-400">Attendance will appear here once classes begin.</p>
        </div>
      )}

      {!isLoading && byStudent.size > 0 && (
        <div className="space-y-8">
          {Array.from(byStudent.entries()).map(([studentId, { studentName, records }]) => (
            <div key={studentId}>
              <h2 className="section-heading text-sm mb-3"><CheckSquare size={16} /> {studentName}</h2>
              <div className="glass-card-static overflow-hidden rounded-2xl">
                <table className="w-full">
                  <thead>
                    <tr className="bg-stone-50/60">
                      <th className="table-header">Date</th>
                      <th className="table-header">Class</th>
                      <th className="table-header text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-50">
                    {(records ?? []).map((rec) => {
                      const session = rec.class_sessions as unknown as {
                        session_date: string;
                        classes: { name: string } | null;
                      } | null;
                      return (
                        <tr key={rec.id} className="table-row-hover">
                          <td className="table-cell text-stone-700">
                            <span className="inline-flex items-center gap-1">
                              <Calendar size={12} className="text-stone-400" />
                              {session?.session_date ?? '—'}
                            </span>
                          </td>
                          <td className="table-cell text-stone-700">
                            {session?.classes?.name ?? '—'}
                          </td>
                          <td className="table-cell text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[rec.status] ?? ''}`}>
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
