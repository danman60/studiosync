'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { keepPreviousData } from '@tanstack/react-query';
import { CheckSquare, AlertTriangle, BarChart3 } from 'lucide-react';

function getInitialDates() {
  const now = new Date();
  const past = new Date(now);
  past.setDate(past.getDate() - 30);
  return {
    start: past.toISOString().split('T')[0]!,
    end: now.toISOString().split('T')[0]!,
  };
}

export default function AdminAttendanceReportPage() {
  const [dates] = useState(getInitialDates);
  const [startDate, setStartDate] = useState(dates.start);
  const [endDate, setEndDate] = useState(dates.end);

  const { data, isLoading } = trpc.admin.attendanceReport.useQuery(
    { startDate, endDate },
    { placeholderData: keepPreviousData }
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Attendance Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Attendance breakdown by class and absentee tracking.</p>
      </div>

      {/* Date Range */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/60 bg-white/80 p-6">
              <div className="mb-3 h-5 w-40 rounded bg-gray-200/60" />
              <div className="h-32 w-full rounded bg-gray-200/40" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-6">
          {/* Attendance by Class */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={16} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900">Attendance by Class</h2>
            </div>

            {data.attendanceByClass.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No attendance data for this period.</p>
            )}

            {data.attendanceByClass.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Class</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-emerald-600">Present</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-red-600">Absent</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-amber-600">Late</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-blue-600">Excused</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.attendanceByClass.map((cls) => {
                      const rate = cls.total > 0 ? Math.round(((cls.present + cls.late) / cls.total) * 100) : 0;
                      return (
                        <tr key={cls.classId} className="transition-colors hover:bg-indigo-50/30">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.name}</td>
                          <td className="px-4 py-3 text-center text-sm text-emerald-600 font-medium">{cls.present}</td>
                          <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{cls.absent}</td>
                          <td className="px-4 py-3 text-center text-sm text-amber-600 font-medium">{cls.late}</td>
                          <td className="px-4 py-3 text-center text-sm text-blue-600 font-medium">{cls.excused}</td>
                          <td className="px-4 py-3 text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              rate >= 90
                                ? 'bg-emerald-500/15 text-emerald-600'
                                : rate >= 70
                                  ? 'bg-amber-500/15 text-amber-600'
                                  : 'bg-red-500/15 text-red-600'
                            }`}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Absentee Report */}
          <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={16} className="text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">Chronic Absentees (&gt;30% absent)</h2>
            </div>

            {data.absenteeReport.length === 0 && (
              <div className="flex flex-col items-center py-8">
                <CheckSquare size={24} className="mb-2 text-emerald-400" />
                <p className="text-sm text-gray-400">No chronic absentees in this period.</p>
              </div>
            )}

            {data.absenteeReport.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Absences</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Total Records</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600">Absence Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.absenteeReport.map((student) => (
                      <tr key={student.childId} className="transition-colors hover:bg-red-50/30">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                        <td className="px-4 py-3 text-center text-sm text-red-600 font-medium">{student.absent}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{student.total}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-600">
                            {student.rate}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
