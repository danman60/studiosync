'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { UserPlus, Pencil, UserX, UserCheck } from 'lucide-react';
import type { StaffRole } from '@/types/database';

const ROLE_LABELS: Record<StaffRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  instructor: 'Instructor',
  front_desk: 'Front Desk',
};

const ROLE_BADGE: Record<StaffRole, string> = {
  owner: 'bg-primary/15 text-primary border border-primary/25',
  admin: 'bg-primary/15 text-primary border border-primary/25',
  instructor: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  front_desk: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
};

type InviteForm = {
  display_name: string;
  email: string;
  role: 'admin' | 'instructor' | 'front_desk';
};

type EditForm = {
  id: string;
  display_name: string;
  role: 'admin' | 'instructor' | 'front_desk';
  phone: string;
};

export default function StaffPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);

  const [inviteForm, setInviteForm] = useState<InviteForm>({
    display_name: '',
    email: '',
    role: 'instructor',
  });

  const utils = trpc.useUtils();
  const staff = trpc.admin.listStaff.useQuery();

  const inviteMutation = trpc.admin.inviteStaff.useMutation({
    onSuccess: () => {
      utils.admin.listStaff.invalidate();
      setInviteOpen(false);
      setInviteForm({ display_name: '', email: '', role: 'instructor' });
    },
  });

  const updateMutation = trpc.admin.updateStaff.useMutation({
    onSuccess: () => {
      utils.admin.listStaff.invalidate();
      setEditTarget(null);
    },
  });

  const removeMutation = trpc.admin.removeStaff.useMutation({
    onSuccess: () => utils.admin.listStaff.invalidate(),
  });

  const reactivateMutation = trpc.admin.updateStaff.useMutation({
    onSuccess: () => utils.admin.listStaff.invalidate(),
  });

  function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    inviteMutation.mutate(inviteForm);
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      display_name: editTarget.display_name,
      role: editTarget.role,
      phone: editTarget.phone || null,
    });
  }

  const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Staff</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage instructors, admins, and front desk staff
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <UserPlus size={16} /> Invite Staff
        </button>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {staff.isLoading && [1, 2].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
              {staff.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-10 text-stone-400">
                    No staff members yet.
                  </td>
                </tr>
              )}
              {staff.data?.map((s) => (
                <tr key={s.id} className="table-row-hover">
                  <td className="table-cell font-medium text-stone-800">{s.display_name}</td>
                  <td className="table-cell text-stone-600">{s.email}</td>
                  <td className="table-cell">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${ROLE_BADGE[s.role as StaffRole]}`}>
                      {ROLE_LABELS[s.role as StaffRole]}
                    </span>
                  </td>
                  <td className="table-cell">
                    {s.active ? (
                      <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-600 border border-emerald-500/25">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-stone-500/15 px-2.5 py-0.5 text-xs font-medium text-stone-500 border border-stone-500/20">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    {s.role !== 'owner' && (
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() =>
                            setEditTarget({
                              id: s.id,
                              display_name: s.display_name,
                              role: s.role as 'admin' | 'instructor' | 'front_desk',
                              phone: s.phone ?? '',
                            })
                          }
                          className="icon-btn"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        {s.active ? (
                          <button
                            onClick={() => removeMutation.mutate({ id: s.id })}
                            disabled={removeMutation.isPending}
                            className="icon-btn icon-btn-danger"
                            title="Deactivate"
                          >
                            <UserX size={15} />
                          </button>
                        ) : (
                          <button
                            onClick={() => reactivateMutation.mutate({ id: s.id, active: true })}
                            disabled={reactivateMutation.isPending}
                            className="icon-btn icon-btn-success"
                            title="Reactivate"
                          >
                            <UserCheck size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Name *</label>
            <input type="text" required value={inviteForm.display_name}
              onChange={(e) => setInviteForm({ ...inviteForm, display_name: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Email *</label>
            <input type="email" required value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className={inputClass} />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Role *</label>
            <select required value={inviteForm.role}
              onChange={(e) => setInviteForm({ ...inviteForm, role: e.target.value as 'admin' | 'instructor' | 'front_desk' })}
              className={inputClass}>
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
              <option value="front_desk">Front Desk</option>
            </select>
          </div>

          {inviteMutation.error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{inviteMutation.error.message}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
            <button type="button" onClick={() => setInviteOpen(false)}
              className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={inviteMutation.isPending}
              className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Staff Member">
        {editTarget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Name *</label>
              <input type="text" required value={editTarget.display_name}
                onChange={(e) => setEditTarget({ ...editTarget, display_name: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Role *</label>
              <select required value={editTarget.role}
                onChange={(e) => setEditTarget({ ...editTarget, role: e.target.value as 'admin' | 'instructor' | 'front_desk' })}
                className={inputClass}>
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
                <option value="front_desk">Front Desk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Phone</label>
              <input type="tel" value={editTarget.phone}
                onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })}
                className={inputClass} />
            </div>

            {updateMutation.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{updateMutation.error.message}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
              <button type="button" onClick={() => setEditTarget(null)}
                className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">
                Cancel
              </button>
              <button type="submit" disabled={updateMutation.isPending}
                className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
