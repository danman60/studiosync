'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { keepPreviousData } from '@tanstack/react-query';
import { CheckSquare, AlertTriangle, BarChart3, Download } from 'lucide-react';

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

  function exportAttendanceCSV() {
    if (!data) return;
    const header = ['Class', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Rate'];
    const csvRows = data.attendanceByClass.map((cls) => {
      const rate = cls.total > 0 ? Math.round(((cls.present + cls.late) / cls.total) * 100) : 0;
      return [cls.name, cls.present, cls.absent, cls.late, cls.excused, cls.total, `${rate}%`]
        .map((v) => `"${v}"`)
        .join(',');
    });
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-${startDate}-to-${endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const inputClass = 'h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Attendance Reports</h1>
          <p className="mt-1 text-sm text-gray-500">Attendance breakdown by class and absentee tracking.</p>
        </div>
        <button
          onClick={exportAttendanceCSV}
          disabled={!data?.attendanceByClass.length}
          className="btn-outline inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-50"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      {/* Date Range */}
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
        </div>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6">
              <div className="mb-3 skeleton h-5 w-40" />
              <div className="skeleton h-32 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && data && (
        <div className="space-y-6">
          {/* Attendance by Class */}
          <div className="glass-card-static overflow-hidden rounded-2xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="section-heading text-sm"><BarChart3 size={16} /> Attendance by Class</h2>
            </div>

            {data.attendanceByClass.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No attendance data for this period.</p>
            )}

            {data.attendanceByClass.length > 0 && (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead>
                    <tr className="bg-gray-50/60">
                      <th className="table-header">Class</th>
                      <th className="table-header text-center text-emerald-600">Present</th>
                      <th className="table-header text-center text-red-600">Absent</th>
                      <th className="table-header text-center text-amber-600">Late</th>
                      <th className="table-header text-center text-blue-600">Excused</th>
                      <th className="table-header text-center">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.attendanceByClass.map((cls) => {
                      const rate = cls.total > 0 ? Math.round(((cls.present + cls.late) / cls.total) * 100) : 0;
                      return (
                        <tr key={cls.classId} className="table-row-hover">
                          <td className="table-cell font-medium text-gray-900">{cls.name}</td>
                          <td className="table-cell text-center text-emerald-600 font-medium">{cls.present}</td>
                          <td className="table-cell text-center text-red-600 font-medium">{cls.absent}</td>
                          <td className="table-cell text-center text-amber-600 font-medium">{cls.late}</td>
                          <td className="table-cell text-center text-blue-600 font-medium">{cls.excused}</td>
                          <td className="table-cell text-center">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                              rate >= 90
                                ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                                : rate >= 70
                                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/25'
                                  : 'bg-red-500/15 text-red-600 border border-red-500/25'
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
          <div className="glass-card-static overflow-hidden rounded-2xl">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="section-heading text-sm"><AlertTriangle size={16} className="text-amber-500" /> Chronic Absentees (&gt;30% absent)</h2>
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
                      <th className="table-header">Student</th>
                      <th className="table-header text-center">Absences</th>
                      <th className="table-header text-center">Total Records</th>
                      <th className="table-header text-center">Absence Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.absenteeReport.map((student) => (
                      <tr key={student.studentId} className="table-row-hover">
                        <td className="table-cell font-medium text-gray-900">{student.name}</td>
                        <td className="table-cell text-center text-red-600 font-medium">{student.absent}</td>
                        <td className="table-cell text-center text-gray-600">{student.total}</td>
                        <td className="table-cell text-center">
                          <span className="inline-flex rounded-full bg-red-500/15 px-2.5 py-0.5 text-[11px] font-medium text-red-600 border border-red-500/25">
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
