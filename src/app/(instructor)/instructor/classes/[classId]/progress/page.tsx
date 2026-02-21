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

  // Build a lookup: childId → mark data for current category
  const marksByChild = useMemo(() => {
    const map: Record<string, { mark?: string | null; score?: number | null; comments?: string | null }> = {};
    for (const m of marks ?? []) {
      if (m.category === category) {
        map[m.child_id] = { mark: m.mark, score: m.score, comments: m.comments };
      }
    }
    return map;
  }, [marks, category]);

  function getEdit(childId: string) {
    return edits[childId] ?? marksByChild[childId] ?? {};
  }

  function setEdit(childId: string, field: string, value: string | number | undefined) {
    setEdits((prev) => ({
      ...prev,
      [childId]: { ...getEdit(childId), [field]: value },
    }));
  }

  async function saveAll() {
    setSaving(true);
    try {
      const promises = Object.entries(edits).map(([childId, data]) =>
        upsertMark.mutateAsync({
          classId,
          childId,
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
            className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
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
            className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
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
                className={`inline-flex h-9 items-center rounded-full border px-3.5 text-xs font-medium transition-all ${
                  category === cat
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Student grid */}
      {roster && roster.length > 0 ? (
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-32">Mark</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-24">Score</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">Comments</th>
              </tr>
            </thead>
            <tbody>
              {roster.map((enrollment) => {
                const child = enrollment.children as unknown as { id: string; first_name: string; last_name: string } | null;
                if (!child) return null;
                const data = getEdit(child.id);

                return (
                  <tr key={child.id} className="border-b border-gray-50 transition-colors hover:bg-indigo-50/30">
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={data.mark ?? ''}
                        onChange={(e) => setEdit(child.id, 'mark', e.target.value || undefined)}
                        className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      >
                        <option value="">—</option>
                        {MARK_OPTIONS.map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={data.score ?? ''}
                        onChange={(e) => setEdit(child.id, 'score', e.target.value ? Number(e.target.value) : undefined)}
                        placeholder="0-100"
                        className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={data.comments ?? ''}
                        onChange={(e) => setEdit(child.id, 'comments', e.target.value || undefined)}
                        placeholder="Optional notes..."
                        className="h-8 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-16">
          <Award size={24} className="mb-3 text-indigo-400" />
          <p className="text-sm font-medium text-gray-600">No students enrolled</p>
          <p className="mt-1 text-xs text-gray-400">Enrolled students will appear here for progress marking.</p>
        </div>
      )}
    </div>
  );
}
