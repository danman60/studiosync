'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Pencil } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

type EditForm = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_notes: string;
};

function ShimmerCard() {
  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="skeleton h-6 w-40 mb-2" />
      <div className="skeleton h-4 w-56 mb-4" />
      <div className="skeleton h-20 w-full" />
    </div>
  );
}

export default function MyChildrenPage() {
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);

  const utils = trpc.useUtils();
  const children = trpc.portal.listStudents.useQuery();

  const updateMutation = trpc.portal.updateStudent.useMutation({
    onSuccess: () => {
      utils.portal.listStudents.invalidate();
      setEditTarget(null);
    },
  });

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      first_name: editTarget.first_name,
      last_name: editTarget.last_name,
      date_of_birth: editTarget.date_of_birth || null,
      gender: editTarget.gender || null,
      medical_notes: editTarget.medical_notes || null,
    });
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">My Students</h1>
        <p className="mt-1 text-sm text-gray-500">Manage your students&apos; profiles and view their enrollments.</p>
      </div>

      {children.isLoading && (
        <div className="space-y-4">
          <ShimmerCard />
          <ShimmerCard />
        </div>
      )}

      {children.data?.length === 0 && (
        <p className="text-sm text-gray-400">No students registered yet. Enroll in a class to get started.</p>
      )}

      <div className="space-y-4">
        {children.data?.map((child, i) => {
          const enrollments = (child.enrollments ?? []) as {
            id: string; status: string;
            classes: { name: string; class_types: { name: string; color: string } | null } | null;
          }[];

          return (
            <div key={child.id} className={`glass-card rounded-2xl p-6 animate-fade-in-up stagger-${Math.min(i + 1, 4)}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {child.first_name} {child.last_name}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    {child.date_of_birth && <span>DOB: {child.date_of_birth}</span>}
                    {child.gender && <span>{child.gender}</span>}
                    {!child.active && (
                      <span className="rounded-full bg-gray-500/15 px-2 py-0.5 text-xs text-gray-500 border border-gray-500/20">Inactive</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() =>
                    setEditTarget({
                      id: child.id,
                      first_name: child.first_name,
                      last_name: child.last_name,
                      date_of_birth: child.date_of_birth ?? '',
                      gender: child.gender ?? '',
                      medical_notes: child.medical_notes ?? '',
                    })
                  }
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-400 transition-colors hover:bg-indigo-50 hover:text-indigo-600"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
              </div>

              {child.medical_notes && (
                <p className="mt-3 text-sm text-gray-600">
                  <span className="font-medium">Medical notes:</span> {child.medical_notes}
                </p>
              )}

              {enrollments.length > 0 && (
                <div className="mt-4 border-t border-gray-100 pt-4">
                  <p className="mb-2.5 text-xs font-semibold uppercase tracking-wider text-gray-400">Enrollments</p>
                  <div className="space-y-2">
                    {enrollments.map((en) => (
                      <div key={en.id} className="flex items-center gap-2.5 text-sm">
                        {en.classes?.class_types && (
                          <span
                            className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: en.classes.class_types.color }}
                          >
                            {en.classes.class_types.name}
                          </span>
                        )}
                        <span className="text-gray-700">{en.classes?.name ?? '—'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                          {en.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Student">
        {editTarget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input type="text" required value={editTarget.first_name}
                  onChange={(e) => setEditTarget({ ...editTarget, first_name: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input type="text" required value={editTarget.last_name}
                  onChange={(e) => setEditTarget({ ...editTarget, last_name: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={editTarget.date_of_birth}
                  onChange={(e) => setEditTarget({ ...editTarget, date_of_birth: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select value={editTarget.gender}
                  onChange={(e) => setEditTarget({ ...editTarget, gender: e.target.value })}
                  className={inputClass}>
                  <option value="">Not specified</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Medical Notes</label>
              <textarea rows={3} value={editTarget.medical_notes}
                onChange={(e) => setEditTarget({ ...editTarget, medical_notes: e.target.value })}
                className={inputClass}
                placeholder="Allergies, conditions, or other notes for instructors" />
            </div>

            {updateMutation.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{updateMutation.error.message}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setEditTarget(null)}
                className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending}
                className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
