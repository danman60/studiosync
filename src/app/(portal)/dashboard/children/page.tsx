'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Pencil } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

type EditForm = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: string;
  medical_notes: string;
};

export default function MyChildrenPage() {
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);

  const utils = trpc.useUtils();
  const children = trpc.portal.listChildren.useQuery();

  const updateMutation = trpc.portal.updateChild.useMutation({
    onSuccess: () => {
      utils.portal.listChildren.invalidate();
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

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
      <p className="mt-1 text-sm text-gray-600">Manage your children&apos;s profiles and view their enrollments.</p>

      {children.isLoading && <p className="mt-6 text-sm text-gray-400">Loading...</p>}

      {children.data?.length === 0 && (
        <p className="mt-6 text-sm text-gray-400">No children registered yet. Enroll in a class to get started.</p>
      )}

      <div className="mt-6 space-y-4">
        {children.data?.map((child) => {
          const enrollments = (child.enrollments ?? []) as {
            id: string; status: string;
            classes: { name: string; class_types: { name: string; color: string } | null } | null;
          }[];

          return (
            <div key={child.id} className="rounded-xl border border-gray-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {child.first_name} {child.last_name}
                  </h3>
                  <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                    {child.date_of_birth && <span>DOB: {child.date_of_birth}</span>}
                    {child.gender && <span>{child.gender}</span>}
                    {!child.active && (
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">Inactive</span>
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
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                  title="Edit"
                >
                  <Pencil size={16} />
                </button>
              </div>

              {child.medical_notes && (
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium">Medical notes:</span> {child.medical_notes}
                </p>
              )}

              {enrollments.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-400">Enrollments</p>
                  <div className="space-y-1.5">
                    {enrollments.map((en) => (
                      <div key={en.id} className="flex items-center gap-2 text-sm">
                        {en.classes?.class_types && (
                          <span
                            className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: en.classes.class_types.color }}
                          >
                            {en.classes.class_types.name}
                          </span>
                        )}
                        <span className="text-gray-700">{en.classes?.name ?? '—'}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Child">
        {editTarget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input type="text" required value={editTarget.first_name}
                  onChange={(e) => setEditTarget({ ...editTarget, first_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input type="text" required value={editTarget.last_name}
                  onChange={(e) => setEditTarget({ ...editTarget, last_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input type="date" value={editTarget.date_of_birth}
                  onChange={(e) => setEditTarget({ ...editTarget, date_of_birth: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Gender</label>
                <select value={editTarget.gender}
                  onChange={(e) => setEditTarget({ ...editTarget, gender: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900">
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
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                placeholder="Allergies, conditions, or other notes for instructors" />
            </div>

            {updateMutation.error && <p className="text-sm text-red-600">{updateMutation.error.message}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setEditTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
