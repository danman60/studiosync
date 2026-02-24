'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Printer, ChevronLeft, Award, BookOpen, Clock } from 'lucide-react';
import Link from 'next/link';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';

const MARK_COLOR: Record<string, string> = {
  'A+': 'bg-emerald-100 text-emerald-700',
  'A': 'bg-emerald-100 text-emerald-700',
  'A-': 'bg-emerald-100 text-emerald-700',
  'B+': 'bg-blue-100 text-blue-700',
  'B': 'bg-blue-100 text-blue-700',
  'B-': 'bg-blue-100 text-blue-700',
  'C+': 'bg-amber-100 text-amber-700',
  'C': 'bg-amber-100 text-amber-700',
  'C-': 'bg-amber-100 text-amber-700',
  'D': 'bg-orange-100 text-orange-700',
  'F': 'bg-red-100 text-red-700',
};

const PERIODS = ['current', 'fall-2025', 'spring-2026', 'summer-2026'];

export default function ReportCardPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [period, setPeriod] = useState('current');

  const { data, isLoading } = trpc.portal.reportCard.useQuery(
    { studentId: studentId!, period },
    { enabled: !!studentId }
  );

  function handlePrint() {
    window.print();
  }

  if (isLoading) {
    return (
      <div>
        <div className="skeleton h-8 w-48 mb-6" />
        <div className="skeleton h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-stone-500">Report card not found.</p>
        <Link href="/dashboard/progress" className="mt-2 text-sm text-primary hover:underline">
          Back to Progress
        </Link>
      </div>
    );
  }

  const { student, studio, enrollments, marksByClass, attendanceByClass } = data;
  const hasAnyMarks = Object.values(marksByClass).some((m) => m && m.length > 0);

  return (
    <div>
      {/* Screen-only controls */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href="/dashboard/progress"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <ChevronLeft size={16} /> Back to Progress
        </Link>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-lg border border-stone-200 bg-white px-3 text-sm text-stone-700"
          >
            {PERIODS.map((p) => (
              <option key={p} value={p}>{p === 'current' ? 'Current Period' : p}</option>
            ))}
          </select>
          <button
            onClick={handlePrint}
            className="btn-gradient inline-flex h-9 items-center gap-2 rounded-lg px-4 text-sm font-medium"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Printable Report Card */}
      <div className="mx-auto max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm print:shadow-none print:border-0 print:p-0 print:rounded-none">
        {/* Header */}
        <div className="border-b-2 border-primary pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-stone-800">{studio.name}</h1>
              <p className="text-sm text-stone-500">
                {studio.email && <span>{studio.email}</span>}
                {studio.email && studio.phone && <span> | </span>}
                {studio.phone && <span>{studio.phone}</span>}
              </p>
            </div>
            <div className="text-right">
              <h2 className="text-lg font-semibold text-primary">Progress Report Card</h2>
              <p className="text-sm text-stone-500 capitalize">
                Period: {period === 'current' ? 'Current' : period}
              </p>
            </div>
          </div>
        </div>

        {/* Student Info */}
        <div className="mb-6 rounded-xl bg-stone-50 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Student</p>
              <p className="text-base font-semibold text-stone-800">{student.first_name} {student.last_name}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-stone-400 uppercase tracking-wider">Date of Birth</p>
              <p className="text-sm text-stone-700">
                {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '—'}
              </p>
            </div>
          </div>
        </div>

        {/* Per-Class Sections */}
        {enrollments.length === 0 && (
          <p className="py-8 text-center text-stone-400">No active enrollments found.</p>
        )}

        {enrollments.map((enrollment) => {
          const cls = enrollment.classes as unknown as {
            name: string;
            day_of_week: number;
            start_time: string;
            end_time: string;
            class_types: { name: string } | null;
            levels: { name: string } | null;
            seasons: { name: string } | { name: string }[] | null;
            staff: { display_name: string } | null;
          } | null;

          if (!cls) return null;

          const classMarks = marksByClass[enrollment.class_id] ?? [];
          const attendance = attendanceByClass[enrollment.class_id];
          const seasonsData = cls.seasons;
          const seasonName = Array.isArray(seasonsData) ? seasonsData[0]?.name : seasonsData?.name;

          // Calculate average score
          const scores = classMarks.filter((m) => m.score != null).map((m) => m.score!);
          const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

          return (
            <div key={enrollment.id} className="mb-6 last:mb-0">
              {/* Class Header */}
              <div className="flex items-center justify-between border-b border-stone-200 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <h3 className="text-base font-semibold text-stone-800">{cls.name}</h3>
                </div>
                <div className="flex items-center gap-3 text-xs text-stone-500">
                  {cls.class_types && <span>{cls.class_types.name}</span>}
                  {cls.levels && <span>| {cls.levels.name}</span>}
                  {seasonName && <span>| {seasonName}</span>}
                </div>
              </div>

              <div className="mb-3 flex items-center gap-4 text-xs text-stone-500">
                <span>{DAYS_OF_WEEK[cls.day_of_week]}s, {formatTime(cls.start_time)} – {formatTime(cls.end_time)}</span>
                {cls.staff && <span>Instructor: {cls.staff.display_name}</span>}
              </div>

              {/* Attendance Summary */}
              {attendance && attendance.total > 0 && (
                <div className="mb-3 rounded-lg bg-stone-50 px-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock size={12} className="text-stone-400" />
                    <span className="text-xs font-medium text-stone-500">Attendance</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-emerald-600">{attendance.present} present</span>
                    <span className="text-red-500">{attendance.absent} absent</span>
                    <span className="text-amber-600">{attendance.late} late</span>
                    <span className="text-stone-500">{attendance.excused} excused</span>
                    <span className="text-stone-400 ml-auto">
                      {attendance.total} sessions | {Math.round(((attendance.present + attendance.late) / attendance.total) * 100)}% attendance
                    </span>
                  </div>
                </div>
              )}

              {/* Marks Table */}
              {classMarks.length > 0 ? (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-stone-200">
                      <th className="text-left py-2 text-xs font-medium text-stone-400 uppercase">Category</th>
                      <th className="text-center py-2 text-xs font-medium text-stone-400 uppercase w-20">Score</th>
                      <th className="text-center py-2 text-xs font-medium text-stone-400 uppercase w-16">Grade</th>
                      <th className="text-left py-2 text-xs font-medium text-stone-400 uppercase">Comments</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {classMarks.map((mark) => (
                      <tr key={mark.id}>
                        <td className="py-2 font-medium text-stone-700">{mark.category}</td>
                        <td className="py-2 text-center text-stone-600">
                          {mark.score != null ? `${mark.score}/100` : '—'}
                        </td>
                        <td className="py-2 text-center">
                          {mark.mark ? (
                            <span className={`inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold ${MARK_COLOR[mark.mark] ?? 'bg-stone-100 text-stone-600'}`}>
                              {mark.mark}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="py-2 text-stone-500 text-xs italic">{mark.comments || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                  {avgScore !== null && (
                    <tfoot>
                      <tr className="border-t-2 border-stone-200">
                        <td className="py-2 font-semibold text-stone-800">Average</td>
                        <td className="py-2 text-center font-semibold text-primary">{avgScore}/100</td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  )}
                </table>
              ) : (
                <p className="py-4 text-center text-xs text-stone-400 italic">No marks recorded for this period.</p>
              )}
            </div>
          );
        })}

        {/* Footer */}
        <div className="mt-8 border-t border-stone-200 pt-4 text-center">
          <p className="text-xs text-stone-400">
            Generated on {new Date().toLocaleDateString()} | {studio.name} | Powered by StudioSync
          </p>
        </div>
      </div>
    </div>
  );
}
