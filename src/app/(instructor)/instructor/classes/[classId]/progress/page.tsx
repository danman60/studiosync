'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Save, ChevronLeft, Award } from 'lucide-react';
import Link from 'next/link';

const MARK_OPTIONS = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];
const DEFAULT_CATEGORIES = ['Technique', 'Musicality', 'Effort', 'Performance'];

export default function ProgressPage() {
  const { classId } = useParams<{ classId: string }>();
  const [period, setPeriod] = useState('current');
  const [category, setCategory] = useState('Technique');
  const [edits, setEdits] = useState<Record<string, { mark?: string; score?: number; comments?: string }>>({});
  const [saving, setSaving] = useState(false);

  const { data: roster } = trpc.instructor.classRoster.useQuery({ classId });
  const { data: marks, refetch: refetchMarks } = trpc.instructor.listProgressMarks.useQuery({
    classId,
    period,
  });
  const upsertMark = trpc.instructor.upsertProgressMark.useMutation();

  const marksByStudent = useMemo(() => {
    const map: Record<string, { mark?: string | null; score?: number | null; comments?: string | null }> = {};
    for (const m of marks ?? []) {
      if (m.category === category) {
        map[m.student_id] = { mark: m.mark, score: m.score, comments: m.comments };
      }
    }
    return map;
  }, [marks, category]);

  function getEdit(studentId: string) {
    return edits[studentId] ?? marksByStudent[studentId] ?? {};
  }

  function setEdit(studentId: string, field: string, value: string | number | undefined) {
    setEdits((prev) => ({
      ...prev,
      [studentId]: { ...getEdit(studentId), [field]: value },
    }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const promises = Object.entries(edits).map(([studentId, data]) =>
        upsertMark.mutateAsync({
          classId,
          studentId,
          period,
          category,
          mark: data.mark,
          score: data.score,
          comments: data.comments,
        })
      );
      await Promise.all(promises);
      setEdits({});
      refetchMarks();
    } finally {
      setSaving(false);
    }
  }

  const hasEdits = Object.keys(edits).length > 0;

  return (
    <div>
      <div className="mb-6">
        <Link
          href={`/instructor/classes/${classId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Class
        </Link>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Progress Marks</h1>
          <p className="mt-1 text-sm text-gray-500">Assess student progress by category and period.</p>
        </div>
        {hasEdits && (
          <button
            onClick={saveAll}
            disabled={saving}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        )}
      </div>

      {/* Period + Category selectors */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Period</label>
          <select
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setEdits({}); }}
            className="h-11 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-700 input-glow"
          >
            <option value="current">Current</option>
            <option value="fall-2025">Fall 2025</option>
            <option value="spring-2026">Spring 2026</option>
            <option value="summer-2026">Summer 2026</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-500">Category</label>
          <div className="flex gap-1.5">
            {DEFAULT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setEdits({}); }}
                className={`filter-chip ${category === cat ? 'filter-chip-active' : ''}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student grid */}
      {roster && roster.length > 0 ? (
        <div className="glass-card-static overflow-hidden rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="table-header">Student</th>
                <th className="table-header w-32">Mark</th>
                <th className="table-header w-24">Score</th>
                <th className="table-header">Comments</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {roster.map((enrollment) => {
                const student = enrollment.students as unknown as { id: string; first_name: string; last_name: string } | null;
                if (!student) return null;
                const data = getEdit(student.id);

                return (
                  <tr key={student.id} className="table-row-hover">
                    <td className="table-cell font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="table-cell">
                      <select
                        value={data.mark ?? ''}
                        onChange={(e) => setEdit(student.id, 'mark', e.target.value || undefined)}
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm input-glow"
                      >
                        <option value="">—</option>
                        {MARK_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                    <td className="table-cell">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={data.score ?? ''}
                        onChange={(e) => setEdit(student.id, 'score', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0-100"
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm input-glow"
                      />
                    </td>
                    <td className="table-cell">
                      <input
                        type="text"
                        value={data.comments ?? ''}
                        onChange={(e) => setEdit(student.id, 'comments', e.target.value || undefined)}
                        placeholder="Optional notes..."
                        className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm input-glow"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Award size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No students enrolled</p>
          <p className="mt-1 text-xs text-gray-400">Enrolled students will appear here for progress marking.</p>
        </div>
      )}
    </div>
  );
}
