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

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
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

  const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Families</h1>
        <p className="mt-1 text-sm text-gray-500">View and manage registered families</p>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Parent Name', 'Email', 'Phone', 'Students', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {families.isLoading && [1, 2].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
              {families.data?.length === 0 && (
                <tr><td colSpan={5} className="table-cell text-center py-10 text-gray-400">No families yet.</td></tr>
              )}
              {families.data?.map((f) => {
                const students = (f.students ?? []) as { id: string; first_name: string; last_name: string; active: boolean }[];
                const activeStudents = students.filter((c) => c.active);
                return (
                  <tr key={f.id} className="table-row-hover">
                    <td className="table-cell font-medium text-gray-900">
                      {f.parent_first_name} {f.parent_last_name}
                    </td>
                    <td className="table-cell text-gray-600">{f.email}</td>
                    <td className="table-cell text-gray-600">{f.phone ?? '—'}</td>
                    <td className="table-cell text-gray-600">
                      {activeStudents.length > 0
                        ? activeStudents.map((c) => `${c.first_name} ${c.last_name}`).join(', ')
                        : '—'}
                    </td>
                    <td className="table-cell text-right">
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
                          className="icon-btn"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => setDetailId(f.id)}
                          className="icon-btn"
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
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input type="text" required value={editTarget.parent_last_name}
                  onChange={(e) => setEditTarget({ ...editTarget, parent_last_name: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email *</label>
              <input type="email" required value={editTarget.email}
                onChange={(e) => setEditTarget({ ...editTarget, email: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="tel" value={editTarget.phone}
                onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })}
                className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Contact</label>
                <input type="text" value={editTarget.emergency_contact_name}
                  onChange={(e) => setEditTarget({ ...editTarget, emergency_contact_name: e.target.value })}
                  className={inputClass} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Emergency Phone</label>
                <input type="tel" value={editTarget.emergency_contact_phone}
                  onChange={(e) => setEditTarget({ ...editTarget, emergency_contact_phone: e.target.value })}
                  className={inputClass} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Notes</label>
              <textarea rows={2} value={editTarget.notes}
                onChange={(e) => setEditTarget({ ...editTarget, notes: e.target.value })}
                className={inputClass} />
            </div>

            {updateMutation.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{updateMutation.error.message}</p>}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setEditTarget(null)}
                className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending}
                className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
                {updateMutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal open={!!detailId} onClose={() => setDetailId(null)} title="Family Details" wide>
        {familyDetail.isLoading && (
          <div className="space-y-3">
            <div className="skeleton h-16 w-full" />
            <div className="skeleton h-20 w-full" />
          </div>
        )}
        {familyDetail.data && (() => {
          const f = familyDetail.data;
          const students = (f.students ?? []) as {
            id: string; first_name: string; last_name: string; date_of_birth: string | null; active: boolean;
            enrollments: { id: string; status: string; classes: { name: string; class_types: { name: string; color: string } | null } | null }[];
          }[];
          return (
            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-4">
                <p className="font-medium text-gray-900">{f.parent_first_name} {f.parent_last_name}</p>
                <p className="text-sm text-gray-600">{f.email}</p>
                {f.phone && <p className="text-sm text-gray-600">{f.phone}</p>}
              </div>

              <h3 className="section-heading text-sm">
                <Users size={16} /> Students
              </h3>
              {students.length === 0 && <p className="text-sm text-gray-400">No students registered.</p>}
              {students.map((student) => (
                <div key={student.id} className="glass-card rounded-xl p-4">
                  <p className="font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                    {student.date_of_birth && <span className="ml-2 text-sm font-normal text-gray-500">DOB: {student.date_of_birth}</span>}
                    {!student.active && <span className="ml-2 rounded-full bg-gray-500/15 px-2 py-0.5 text-[11px] text-gray-500 border border-gray-500/20">Inactive</span>}
                  </p>
                  {student.enrollments?.length > 0 && (
                    <div className="mt-2.5 space-y-1.5">
                      {student.enrollments.map((en) => (
                        <div key={en.id} className="flex items-center gap-2 text-sm text-gray-600">
                          {en.classes?.class_types && (
                            <span className="rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: en.classes.class_types.color }}>
                              {en.classes.class_types.name}
                            </span>
                          )}
                          <span>{en.classes?.name ?? '—'}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
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
