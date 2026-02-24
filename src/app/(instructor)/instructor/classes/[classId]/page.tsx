'use client';

import { trpc } from '@/lib/trpc';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckSquare, Users } from 'lucide-react';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function calculateAge(dob: string): number {
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
}

export default function InstructorClassDetailPage() {
  const params = useParams();
  const classId = params.classId as string;

  const classes = trpc.instructor.myClasses.useQuery();
  const roster = trpc.instructor.classRoster.useQuery({ classId });
  const summary = trpc.instructor.attendanceSummary.useQuery({ classId });

  const cls = (classes.data ?? []).find((c) => c.id === classId);
  const classType = cls?.class_types as unknown as { name: string; color: string } | null;
  const level = cls?.levels as unknown as { name: string } | null;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link href="/instructor/classes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary transition-colors">
          <ArrowLeft size={16} /> Back to My Classes
        </Link>
        {cls ? (
          <>
            <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">{cls.name}</h1>
            <p className="mt-1 text-sm text-stone-500">
              {classType?.name}{level ? ` - ${level.name}` : ''} | {DAY_NAMES[cls.day_of_week]} {cls.start_time?.slice(0, 5)} - {cls.end_time?.slice(0, 5)} | {cls.room ?? 'No room'}
            </p>
          </>
        ) : classes.isLoading ? (
          <>
            <div className="skeleton h-8 w-48 mb-2" />
            <div className="skeleton h-4 w-64" />
          </>
        ) : (
          <h1 className="text-xl font-bold text-red-600">Class not found</h1>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-8">
        <Link
          href={`/instructor/classes/${classId}/attendance`}
          className="glass-card flex items-center gap-4 rounded-2xl bg-primary-50 p-6 animate-fade-in-up stagger-1"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-primary">
            <CheckSquare size={22} />
          </div>
          <div>
            <p className="font-medium text-stone-800">Take Attendance</p>
            <p className="text-sm text-stone-500">Mark today&apos;s attendance</p>
          </div>
        </Link>

        <div className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Users size={22} />
          </div>
          <div>
            <p className="font-medium text-stone-800">{roster.data?.length ?? '—'} Students</p>
            <p className="text-sm text-stone-500">
              {summary.data ? `${summary.data.completedSessions} sessions completed` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {summary.data && summary.data.totalSessions > 0 && (
        <div className="mb-8">
          <h2 className="section-heading text-sm mb-3"><CheckSquare size={16} /> Attendance Summary</h2>
          <div className="glass-card-static rounded-2xl p-5">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {(['present', 'absent', 'late', 'excused'] as const).map((status) => {
                const count = summary.data?.attendanceByStatus[status] ?? 0;
                const colors: Record<string, string> = {
                  present: 'text-emerald-600',
                  absent: 'text-red-600',
                  late: 'text-amber-600',
                  excused: 'text-blue-600',
                };
                return (
                  <div key={status} className="text-center">
                    <p className={`stat-number ${colors[status]}`}>{count}</p>
                    <p className="text-xs text-stone-500 capitalize">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Roster */}
      <div>
        <h2 className="section-heading text-sm mb-3"><Users size={16} /> Class Roster</h2>
        <div className="glass-card-static overflow-hidden rounded-2xl">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                <th className="table-header">Student</th>
                <th className="table-header">Age</th>
                <th className="table-header">Medical Notes</th>
                <th className="table-header text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {roster.isLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <tr key={i}>
                      {[1, 2, 3, 4].map((j) => (
                        <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-24" /></td>
                      ))}
                    </tr>
                  ))}
                </>
              )}
              {!roster.isLoading && (roster.data?.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-stone-400">No students enrolled</td>
                </tr>
              )}
              {(roster.data ?? []).map((enrollment) => {
                const student = enrollment.students as unknown as {
                  id: string;
                  first_name: string;
                  last_name: string;
                  date_of_birth: string | null;
                  medical_notes: string | null;
                } | null;
                if (!student) return null;

                const age = student.date_of_birth
                  ? calculateAge(student.date_of_birth)
                  : null;

                return (
                  <tr key={enrollment.id} className="table-row-hover">
                    <td className="table-cell font-medium text-stone-800">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="table-cell text-stone-600">
                      {age !== null ? `${age} yrs` : '—'}
                    </td>
                    <td className="table-cell text-stone-600">
                      {student.medical_notes ? (
                        <span className="text-amber-600">{student.medical_notes}</span>
                      ) : (
                        <span className="text-stone-400">None</span>
                      )}
                    </td>
                    <td className="table-cell text-center">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        enrollment.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                          : enrollment.status === 'pending'
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/25'
                            : 'bg-stone-100 text-stone-600'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
