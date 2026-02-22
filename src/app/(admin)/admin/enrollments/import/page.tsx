'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Upload, ChevronLeft, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function BulkEnrollmentImportPage() {
  const [classId, setClassId] = useState('');
  const [pairs, setPairs] = useState<Array<{ childId: string; familyId: string }>>([]);
  const [result, setResult] = useState<{ enrolled: number; skipped: number } | null>(null);

  const classes = trpc.admin.listClasses.useQuery();
  const families = trpc.admin.listFamilies.useQuery();

  const bulkEnroll = trpc.admin.bulkEnroll.useMutation({
    onSuccess: (data) => {
      setResult(data);
      setPairs([]);
    },
  });

  // Build child options from families data
  const childOptions: Array<{ childId: string; familyId: string; label: string }> = [];
  for (const fam of families.data ?? []) {
    const children = (fam as Record<string, unknown>).children as Array<{ id: string; first_name: string; last_name: string }> | undefined;
    if (children) {
      for (const child of children) {
        childOptions.push({
          childId: child.id,
          familyId: fam.id,
          label: `${child.first_name} ${child.last_name} (${fam.parent_first_name} ${fam.parent_last_name})`,
        });
      }
    }
  }

  function addPair(childId: string, familyId: string) {
    if (pairs.some((p) => p.childId === childId)) return;
    setPairs((prev) => [...prev, { childId, familyId }]);
  }

  function removePair(childId: string) {
    setPairs((prev) => prev.filter((p) => p.childId !== childId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || pairs.length === 0) return;
    bulkEnroll.mutate({ classId, entries: pairs });
  }

  return (
    <div>
      <Link
        href="/admin/enrollments"
        className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
      >
        <ChevronLeft size={16} /> Back to Enrollments
      </Link>

      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Bulk Enrollment Import</h1>
        <p className="mt-1 text-sm text-gray-500">Add multiple students to a class at once.</p>
      </div>

      {result && (
        <div className="mb-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5">
          <div className="flex items-center gap-3">
            <CheckCircle size={20} className="text-emerald-600" />
            <div>
              <p className="text-sm font-medium text-emerald-800">
                {result.enrolled} student{result.enrolled !== 1 ? 's' : ''} enrolled successfully
              </p>
              {result.skipped > 0 && (
                <p className="text-xs text-emerald-600">
                  {result.skipped} already enrolled (skipped)
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="glass-card-static rounded-2xl p-6 space-y-6">
        {/* Class Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Class *</label>
          <select
            value={classId}
            onChange={(e) => { setClassId(e.target.value); setResult(null); }}
            required
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow"
          >
            <option value="">Select a class...</option>
            {(classes.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} (capacity: {c.capacity})
              </option>
            ))}
          </select>
        </div>

        {/* Student Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Add Students</label>
          <select
            onChange={(e) => {
              const opt = childOptions.find((o) => o.childId === e.target.value);
              if (opt) addPair(opt.childId, opt.familyId);
              e.target.value = '';
            }}
            className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow"
          >
            <option value="">Select a student to add...</option>
            {childOptions
              .filter((o) => !pairs.some((p) => p.childId === o.childId))
              .map((o) => (
                <option key={o.childId} value={o.childId}>
                  {o.label}
                </option>
              ))}
          </select>
        </div>

        {/* Selected Students */}
        {pairs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              {pairs.length} student{pairs.length !== 1 ? 's' : ''} selected
            </p>
            <div className="space-y-2">
              {pairs.map((p) => {
                const opt = childOptions.find((o) => o.childId === p.childId);
                return (
                  <div
                    key={p.childId}
                    className="flex items-center justify-between rounded-xl bg-indigo-50/60 border border-indigo-100 px-4 py-2.5"
                  >
                    <span className="text-sm text-gray-700">{opt?.label ?? p.childId}</span>
                    <button
                      type="button"
                      onClick={() => removePair(p.childId)}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {bulkEnroll.isError && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle size={16} /> {bulkEnroll.error.message}
          </div>
        )}

        <button
          type="submit"
          disabled={!classId || pairs.length === 0 || bulkEnroll.isPending}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
        >
          <Upload size={16} />
          {bulkEnroll.isPending ? 'Enrolling...' : `Enroll ${pairs.length} Student${pairs.length !== 1 ? 's' : ''}`}
        </button>
      </form>
    </div>
  );
}
