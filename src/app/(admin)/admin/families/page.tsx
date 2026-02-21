'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Pencil, ChevronRight, Users } from 'lucide-react';

type EditForm = {
  id: string;
  parent_first_name: string;
  parent_last_name: string;
  email: string;
  phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  notes: string;
};

export default function FamiliesPage() {
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const families = trpc.admin.listFamilies.useQuery();
  const familyDetail = trpc.admin.getFamily.useQuery(
    { id: detailId! },
    { enabled: !!detailId }
  );

  const updateMutation = trpc.admin.updateFamily.useMutation({
    onSuccess: () => {
      utils.admin.listFamilies.invalidate();
      if (detailId) utils.admin.getFamily.invalidate({ id: detailId });
      setEditTarget(null);
    },
  });

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      parent_first_name: editTarget.parent_first_name,
      parent_last_name: editTarget.parent_last_name,
      email: editTarget.email,
      phone: editTarget.phone || null,
      emergency_contact_name: editTarget.emergency_contact_name || null,
      emergency_contact_phone: editTarget.emergency_contact_phone || null,
      notes: editTarget.notes || null,
    });
  }

  const STATUS_COLORS: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    pending: 'bg-yellow-100 text-yellow-700',
    waitlisted: 'bg-blue-100 text-blue-700',
    dropped: 'bg-gray-100 text-gray-500',
    cancelled: 'bg-red-100 text-red-600',
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Families</h1>
        <p className="mt-1 text-sm text-gray-600">View and manage registered families</p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Parent Name', 'Email', 'Phone', 'Children', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {families.isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            )}
            {families.data?.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No families yet.</td></tr>
            )}
            {families.data?.map((f) => {
              const children = (f.children ?? []) as { id: string; first_name: string; last_name: string; active: boolean }[];
              const activeChildren = children.filter((c) => c.active);
              return (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {f.parent_first_name} {f.parent_last_name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.email}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {activeChildren.length > 0
                      ? activeChildren.map((c) => `${c.first_name} ${c.last_name}`).join(', ')
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditTarget({
                          id: f.id,
                          parent_first_name: f.parent_first_name,
                          parent_last_name: f.parent_last_name,
                          email: f.email,
                          phone: f.phone ?? '',
                          emergency_contact_name: f.emergency_contact_name ?? '',
                          emergency_contact_phone: f.emergency_contact_phone ?? '',
                          notes: f.notes ?? '',
                        })}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDetailId(f.id)}
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        title="View details"
                      >
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Family">
        {editTarget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input type="text" required value={editTarget.parent_first_name}
                  onChange={(e) => setEditTarget({ ...editTarget, parent_first_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input type="text" required value={editTarget.parent_last_name}
                  onChange={(e) => setEditTarget({ ...editTarget, parent_last_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={editTarget.email}
                onChange={(e) => setEditTarget({ ...editTarget, email: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="tel" value={editTarget.phone}
                onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <input type="text" value={editTarget.emergency_contact_name}
                  onChange={(e) => setEditTarget({ ...editTarget, emergency_contact_name: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                <input type="tel" value={editTarget.emergency_contact_phone}
                  onChange={(e) => setEditTarget({ ...editTarget, emergency_contact_phone: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={2} value={editTarget.notes}
                onChange={(e) => setEditTarget({ ...editTarget, notes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900" />
            </div>

            {updateMutation.error && <p className="text-sm text-red-600">{updateMutation.error.message}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setEditTarget(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Family Details" wide>
        {familyDetail.isLoading && <p className="text-sm text-gray-400">Loading...</p>}
        {familyDetail.data && (() => {
          const f = familyDetail.data;
          const children = (f.children ?? []) as {
            id: string; first_name: string; last_name: string; date_of_birth: string | null; active: boolean;
            enrollments: { id: string; status: string; classes: { name: string; class_types: { name: string; color: string } | null } | null }[];
          }[];
          return (
            <div className="space-y-4">
              <div className="rounded-lg bg-gray-50 p-4">
                <p className="font-medium text-gray-900">{f.parent_first_name} {f.parent_last_name}</p>
                <p className="text-sm text-gray-600">{f.email}</p>
                {f.phone && <p className="text-sm text-gray-600">{f.phone}</p>}
              </div>

              <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Users size={16} /> Children
              </h3>
              {children.length === 0 && <p className="text-sm text-gray-400">No children registered.</p>}
              {children.map((child) => (
                <div key={child.id} className="rounded-lg border border-gray-200 p-3">
                  <p className="font-medium text-gray-900">
                    {child.first_name} {child.last_name}
                    {child.date_of_birth && <span className="ml-2 text-sm font-normal text-gray-500">DOB: {child.date_of_birth}</span>}
                    {!child.active && <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-500">Inactive</span>}
                  </p>
                  {child.enrollments?.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {child.enrollments.map((en) => (
                        <div key={en.id} className="flex items-center gap-2 text-sm text-gray-600">
                          {en.classes?.class_types && (
                            <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: en.classes.class_types.color }}>
                              {en.classes.class_types.name}
                            </span>
                          )}
                          <span>{en.classes?.name ?? '—'}</span>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {en.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
