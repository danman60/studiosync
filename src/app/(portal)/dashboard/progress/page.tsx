'use client';

import Link from 'next/link';
import { trpc } from '@/lib/trpc';
import { Award, BookOpen, Printer } from 'lucide-react';

const MARK_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  'A': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  'A-': 'bg-emerald-500/15 text-emerald-600 border-emerald-500/25',
  'B+': 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  'B': 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  'B-': 'bg-blue-500/15 text-blue-600 border-blue-500/25',
  'C+': 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  'C': 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  'C-': 'bg-amber-500/15 text-amber-600 border-amber-500/25',
  'D': 'bg-orange-500/15 text-orange-600 border-orange-500/25',
  'F': 'bg-red-500/15 text-red-600 border-red-500/25',
};

export default function ParentProgressPage() {
  const { data: dashboardData, isLoading: loadingDash } = trpc.portal.dashboardData.useQuery();
  const { data: marks, isLoading: loadingMarks } = trpc.portal.studentProgressMarks.useQuery();

  const isLoading = loadingDash || loadingMarks;
  const students = dashboardData?.students ?? [];

  // Group marks by student, then by class, then by category
  type MarkRecord = NonNullable<typeof marks>[number];
  const grouped = new Map<string, Map<string, MarkRecord[]>>();
  for (const m of marks ?? []) {
    if (!grouped.has(m.student_id)) grouped.set(m.student_id, new Map());
    const studentMap = grouped.get(m.student_id)!;
    const classId = m.class_id;
    if (!studentMap.has(classId)) studentMap.set(classId, []);
    studentMap.get(classId)!.push(m);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Progress Reports</h1>
        <p className="mt-1 text-sm text-gray-500">See how your students are progressing in their classes.</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6">
              <div className="mb-4 skeleton h-5 w-40" />
              <div className="space-y-3">
                <div className="skeleton h-12 rounded-xl" />
                <div className="skeleton h-12 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Progress by student */}
      {!isLoading && students.length > 0 && (
        <div className="space-y-6">
          {students.map((student, idx) => {
            const studentMarks = grouped.get(student.id);
            const hasMarks = studentMarks && studentMarks.size > 0;

            return (
              <div
                key={student.id}
                className={`glass-card-static rounded-2xl p-6 animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <Award size={20} className="text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-base font-semibold text-gray-900">
                      {student.first_name} {student.last_name}
                    </h2>
                    <p className="text-xs text-gray-400">
                      {hasMarks ? `${Array.from(studentMarks.values()).flat().length} marks across ${studentMarks.size} class${studentMarks.size > 1 ? 'es' : ''}` : 'No marks yet'}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/report-card/${student.id}`}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <Printer size={14} /> Report Card
                  </Link>
                </div>

                {hasMarks ? (
                  <div className="space-y-4">
                    {Array.from(studentMarks.entries()).map(([classId, classMarks]) => {
                      const classInfo = classMarks[0]?.classes as unknown as { name: string } | null;
                      return (
                        <div key={classId} className="rounded-xl border border-gray-100 p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <BookOpen size={14} className="text-indigo-500" />
                            <span className="text-sm font-medium text-gray-700">
                              {classInfo?.name ?? 'Class'}
                            </span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500">
                              {classMarks[0]?.period ?? 'current'}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {classMarks.map((m) => (
                              <div
                                key={m.id}
                                className="flex items-center justify-between rounded-lg bg-gray-50/80 px-3 py-2"
                              >
                                <span className="text-xs font-medium text-gray-600">{m.category}</span>
                                <div className="flex items-center gap-2">
                                  {m.score != null && (
                                    <span className="text-xs text-gray-500">{m.score}/100</span>
                                  )}
                                  {m.mark && (
                                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${MARK_COLOR[m.mark] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                      {m.mark}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          {classMarks.some((m) => m.comments) && (
                            <div className="mt-2 space-y-1">
                              {classMarks.filter((m) => m.comments).map((m) => (
                                <p key={m.id} className="text-xs text-gray-400 italic">
                                  <span className="font-medium text-gray-500">{m.category}:</span> {m.comments}
                                </p>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">No progress marks have been recorded yet.</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && students.length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Award size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No students found</p>
          <p className="mt-1 text-xs text-gray-400">Add students to your family to see their progress.</p>
        </div>
      )}
    </div>
  );
}
