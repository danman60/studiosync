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

const ROLE_COLORS: Record<StaffRole, string> = {
  owner: 'bg-purple-100 text-purple-700',
  admin: 'bg-indigo-100 text-indigo-700',
  instructor: 'bg-emerald-100 text-emerald-700',
  front_desk: 'bg-amber-100 text-amber-700',
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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage instructors, admins, and front desk staff
          </p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <UserPlus size={16} /> Invite Staff
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Email', 'Role', 'Status', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {staff.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                  No staff members yet.
                </td>
              </tr>
            )}
            {staff.data?.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {s.display_name}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{s.email}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      ROLE_COLORS[s.role as StaffRole]
                    }`}
                  >
                    {ROLE_LABELS[s.role as StaffRole]}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {s.active ? (
                    <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
                      Inactive
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
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
                        className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      {s.active ? (
                        <button
                          onClick={() => removeMutation.mutate({ id: s.id })}
                          disabled={removeMutation.isPending}
                          className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
                          title="Deactivate"
                        >
                          <UserX size={15} />
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            reactivateMutation.mutate({ id: s.id, active: true })
                          }
                          disabled={reactivateMutation.isPending}
                          className="rounded p-1.5 text-gray-400 hover:bg-green-50 hover:text-green-600"
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

      {/* Invite Modal */}
      <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite Staff Member">
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={inviteForm.display_name}
              onChange={(e) => setInviteForm({ ...inviteForm, display_name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input
              type="email"
              required
              value={inviteForm.email}
              onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role *</label>
            <select
              required
              value={inviteForm.role}
              onChange={(e) =>
                setInviteForm({
                  ...inviteForm,
                  role: e.target.value as 'admin' | 'instructor' | 'front_desk',
                })
              }
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            >
              <option value="instructor">Instructor</option>
              <option value="admin">Admin</option>
              <option value="front_desk">Front Desk</option>
            </select>
          </div>

          {inviteMutation.error && (
            <p className="text-sm text-red-600">{inviteMutation.error.message}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={() => setInviteOpen(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={inviteMutation.isPending}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {inviteMutation.isPending ? 'Inviting...' : 'Invite'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title="Edit Staff Member"
      >
        {editTarget && (
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name *</label>
              <input
                type="text"
                required
                value={editTarget.display_name}
                onChange={(e) =>
                  setEditTarget({ ...editTarget, display_name: e.target.value })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role *</label>
              <select
                required
                value={editTarget.role}
                onChange={(e) =>
                  setEditTarget({
                    ...editTarget,
                    role: e.target.value as 'admin' | 'instructor' | 'front_desk',
                  })
                }
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="instructor">Instructor</option>
                <option value="admin">Admin</option>
                <option value="front_desk">Front Desk</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                value={editTarget.phone}
                onChange={(e) => setEditTarget({ ...editTarget, phone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {updateMutation.error && (
              <p className="text-sm text-red-600">{updateMutation.error.message}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setEditTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
