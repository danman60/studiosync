'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, BookOpen, Users, CheckCircle, AlertCircle } from 'lucide-react';

const PERIODS = ['current', 'fall-2025', 'spring-2026', 'summer-2026'];

export default function AdminReportsPage() {
  const [period, setPeriod] = useState('current');
  const overview = trpc.admin.reportCardOverview.useQuery({ period });

  const totalClasses = overview.data?.length ?? 0;
  const classesWithMarks = overview.data?.filter((c) => c.markedStudents > 0).length ?? 0;
  const totalStudents = overview.data?.reduce((s, c) => s + c.enrolledStudents, 0) ?? 0;
  const totalMarked = overview.data?.reduce((s, c) => s + c.markedStudents, 0) ?? 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Report Cards</h1>
          <p className="mt-1 text-sm text-gray-500">Track progress mark completion across classes.</p>
        </div>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 transition-shadow input-glow"
        >
          {PERIODS.map((p) => (
            <option key={p} value={p}>{p === 'current' ? 'Current Period' : p}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        <div className="glass-card rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <BookOpen size={20} />
            </div>
            <div>
              <p className="stat-number">{totalClasses}</p>
              <p className="text-xs text-gray-500">Active Classes</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CheckCircle size={20} />
            </div>
            <div>
              <p className="stat-number">{classesWithMarks} / {totalClasses}</p>
              <p className="text-xs text-gray-500">Classes with Marks</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Users size={20} />
            </div>
            <div>
              <p className="stat-number">{totalStudents}</p>
              <p className="text-xs text-gray-500">Enrolled Students</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-6 animate-fade-in-up stagger-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="stat-number">{totalMarked} / {totalStudents}</p>
              <p className="text-xs text-gray-500">Students Graded</p>
            </div>
          </div>
        </div>
      </div>

      {/* Class Completion Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Class', 'Type', 'Instructor', 'Students', 'Graded', 'Completion', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {overview.isLoading && [1, 2, 3, 4].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {overview.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-14">
                    <FileText size={32} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-400">No active classes found.</p>
                  </td>
                </tr>
              )}
              {overview.data?.map((cls) => (
                <tr key={cls.id} className="table-row-hover">
                  <td className="table-cell font-medium text-gray-900">{cls.name}</td>
                  <td className="table-cell text-gray-600">
                    {cls.classType && (
                      <span className="inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        {cls.classType}
                      </span>
                    )}
                    {cls.level && (
                      <span className="ml-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[11px] text-gray-600">
                        {cls.level}
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-gray-600">{cls.instructor ?? '—'}</td>
                  <td className="table-cell text-gray-600">{cls.enrolledStudents}</td>
                  <td className="table-cell">
                    <span className={cls.markedStudents > 0 ? 'text-emerald-600 font-medium' : 'text-gray-400'}>
                      {cls.markedStudents}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-20 rounded-full bg-gray-100 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            cls.completionPercent === 100 ? 'bg-emerald-500' :
                            cls.completionPercent > 0 ? 'bg-indigo-500' : 'bg-gray-200'
                          }`}
                          style={{ width: `${cls.completionPercent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8">{cls.completionPercent}%</span>
                    </div>
                  </td>
                  <td className="table-cell">
                    {cls.completionPercent === 100 ? (
                      <CheckCircle size={16} className="text-emerald-500" />
                    ) : cls.enrolledStudents > 0 && cls.markedStudents === 0 ? (
                      <AlertCircle size={16} className="text-amber-400" />
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
