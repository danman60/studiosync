'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, Save } from 'lucide-react';

type AttendanceStatus = 'present' | 'absent' | 'late' | 'excused';

const STATUS_OPTIONS: { value: AttendanceStatus; label: string; color: string; bg: string }[] = [
  { value: 'present', label: 'Present', color: 'text-emerald-700', bg: 'bg-emerald-100 border-emerald-300' },
  { value: 'absent', label: 'Absent', color: 'text-red-700', bg: 'bg-red-100 border-red-300' },
  { value: 'late', label: 'Late', color: 'text-amber-700', bg: 'bg-amber-100 border-amber-300' },
  { value: 'excused', label: 'Excused', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-300' },
];

export default function AttendancePage() {
  const params = useParams();
  const classId = params.classId as string;
  const utils = trpc.useUtils();

  const today = new Date().toISOString().split('T')[0]!;
  const [selectedDate, setSelectedDate] = useState(today);
  // `overrides` holds user-modified statuses; merged with DB data during render
  const [overrides, setOverrides] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const classes = trpc.instructor.myClasses.useQuery();
  const roster = trpc.instructor.classRoster.useQuery({ classId });
  const session = trpc.instructor.getSession.useQuery(
    { classId, date: selectedDate },
    { enabled: !!selectedDate }
  );
  const existingAttendance = trpc.instructor.getAttendance.useQuery(
    { sessionId: session.data?.id ?? '' },
    { enabled: !!session.data?.id }
  );

  // Merge existing DB records with user overrides (overrides take precedence)
  const records = useMemo(() => {
    const base: Record<string, AttendanceStatus> = {};
    if (existingAttendance.data) {
      for (const r of existingAttendance.data) {
        base[r.child_id] = r.status as AttendanceStatus;
      }
    }
    return { ...base, ...overrides };
  }, [existingAttendance.data, overrides]);

  const markMutation = trpc.instructor.markAttendance.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      utils.instructor.getAttendance.invalidate();
      utils.instructor.attendanceSummary.invalidate();
    },
  });

  const cls = (classes.data ?? []).find((c) => c.id === classId);

  const handleStatusChange = (childId: string, status: AttendanceStatus) => {
    setOverrides((prev) => ({ ...prev, [childId]: status }));
    setSaved(false);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    for (const enrollment of roster.data ?? []) {
      const child = enrollment.children as unknown as { id: string } | null;
      if (child) all[child.id] = status;
    }
    setOverrides(all);
    setSaved(false);
  };

  const handleSave = () => {
    if (!session.data?.id) return;

    const attendanceRecords = Object.entries(records).map(([childId, status]) => ({
      childId,
      status,
    }));

    if (attendanceRecords.length === 0) return;

    markMutation.mutate({
      sessionId: session.data.id,
      records: attendanceRecords,
    });
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          href={`/instructor/classes/${classId}`}
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} /> Back to {cls?.name ?? 'Class'}
        </Link>
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">
          Attendance
        </h1>
        <p className="mt-1 text-sm text-gray-500">{cls?.name ?? 'Loading...'}</p>
      </div>

      {/* Date Picker + Quick Actions */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setOverrides({});
              setSaved(false);
            }}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-end gap-2">
          <label className="block text-xs font-medium text-gray-500 mb-1 sr-only">Quick</label>
          <button
            onClick={() => handleMarkAll('present')}
            className="rounded-xl bg-emerald-100 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
          >
            All Present
          </button>
          <button
            onClick={() => handleMarkAll('absent')}
            className="rounded-xl bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200"
          >
            All Absent
          </button>
        </div>

        {session.data?.status === 'completed' && (
          <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-600">
            Session Completed
          </span>
        )}
      </div>

      {/* Attendance Grid */}
      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/60">
              <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">
                Student
              </th>
              {STATUS_OPTIONS.map((opt) => (
                <th key={opt.value} className="px-3 py-3.5 text-center text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {opt.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {roster.isLoading && (
              <>
                {[1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td className="px-5 py-4"><div className="skeleton h-4 w-32" /></td>
                    {[1, 2, 3, 4].map((j) => (
                      <td key={j} className="px-3 py-4 text-center"><div className="skeleton mx-auto h-8 w-8 rounded-lg" /></td>
                    ))}
                  </tr>
                ))}
              </>
            )}
            {!roster.isLoading && (roster.data?.length ?? 0) === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-gray-400">
                  No students enrolled
                </td>
              </tr>
            )}
            {(roster.data ?? []).map((enrollment) => {
              const child = enrollment.children as unknown as {
                id: string;
                first_name: string;
                last_name: string;
              } | null;
              if (!child) return null;

              const currentStatus = records[child.id];

              return (
                <tr key={enrollment.id} className="transition-colors hover:bg-indigo-50/40">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">
                    {child.first_name} {child.last_name}
                  </td>
                  {STATUS_OPTIONS.map((opt) => (
                    <td key={opt.value} className="px-3 py-3 text-center">
                      <button
                        onClick={() => handleStatusChange(child.id, opt.value)}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${
                          currentStatus === opt.value
                            ? `${opt.bg} ${opt.color} shadow-sm`
                            : 'border-gray-200 bg-white text-gray-300 hover:border-gray-300 hover:text-gray-500'
                        }`}
                        title={opt.label}
                      >
                        {currentStatus === opt.value && <Check size={16} />}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={markMutation.isPending || Object.keys(records).length === 0}
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <Save size={16} />
          {markMutation.isPending ? 'Saving...' : 'Save Attendance'}
        </button>
        {saved && (
          <span className="text-sm text-emerald-600 font-medium">Saved successfully</span>
        )}
        {markMutation.isError && (
          <span className="text-sm text-red-600">{markMutation.error.message}</span>
        )}
      </div>
    </div>
  );
}
