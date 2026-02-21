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
        <Link href="/instructor/classes" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={16} /> Back to My Classes
        </Link>
        {cls ? (
          <>
            <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">{cls.name}</h1>
            <p className="mt-1 text-sm text-gray-500">
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
          className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6 transition-colors hover:bg-indigo-50/60"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <CheckSquare size={22} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Take Attendance</p>
            <p className="text-sm text-gray-500">Mark today&apos;s attendance</p>
          </div>
        </Link>

        <div className="glass-card flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
            <Users size={22} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{roster.data?.length ?? '—'} Students</p>
            <p className="text-sm text-gray-500">
              {summary.data ? `${summary.data.completedSessions} sessions completed` : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Attendance Summary */}
      {summary.data && summary.data.totalSessions > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Attendance Summary</h2>
          <div className="glass-card rounded-2xl p-5">
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
                    <p className={`text-2xl font-bold ${colors[status]}`}>{count}</p>
                    <p className="text-xs text-gray-500 capitalize">{status}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Roster */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Class Roster</h2>
        <div className="glass-card overflow-x-auto rounded-2xl">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Student', 'Age', 'Medical Notes', 'Status'].map((h) => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
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
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-gray-400">No students enrolled</td>
                </tr>
              )}
              {(roster.data ?? []).map((enrollment) => {
                const child = enrollment.children as unknown as {
                  id: string;
                  first_name: string;
                  last_name: string;
                  date_of_birth: string | null;
                  medical_notes: string | null;
                } | null;
                if (!child) return null;

                const age = child.date_of_birth
                  ? calculateAge(child.date_of_birth)
                  : null;

                const statusColors: Record<string, string> = {
                  active: 'bg-emerald-500/15 text-emerald-600',
                  pending: 'bg-amber-500/15 text-amber-600',
                };

                return (
                  <tr key={enrollment.id} className="transition-colors hover:bg-indigo-50/40">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">
                      {child.first_name} {child.last_name}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {age !== null ? `${age} yrs` : '—'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {child.medical_notes ? (
                        <span className="text-amber-600">{child.medical_notes}</span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[enrollment.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
