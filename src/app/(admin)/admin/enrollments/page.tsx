'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { ChevronDown } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  waitlisted: 'bg-blue-100 text-blue-700',
  dropped: 'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

type StatusAction = { id: string; childName: string; className: string; currentStatus: string };

export default function EnrollmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [actionTarget, setActionTarget] = useState<StatusAction | null>(null);
  const [newStatus, setNewStatus] = useState<'active' | 'dropped' | 'cancelled'>('active');
  const [dropReason, setDropReason] = useState('');

  const utils = trpc.useUtils();
  const enrollments = trpc.admin.listEnrollments.useQuery(
    statusFilter ? { status: statusFilter as 'pending' | 'active' | 'waitlisted' | 'dropped' | 'cancelled' } : undefined
  );

  const updateMutation = trpc.admin.updateEnrollmentStatus.useMutation({
    onSuccess: () => {
      utils.admin.listEnrollments.invalidate();
      setActionTarget(null);
      setDropReason('');
    },
  });

  function handleStatusUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!actionTarget) return;
    updateMutation.mutate({
      id: actionTarget.id,
      status: newStatus,
      drop_reason: newStatus === 'dropped' ? dropReason : undefined,
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enrollments</h1>
          <p className="mt-1 text-sm text-gray-600">View and manage class enrollments</p>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="appearance-none rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-8 text-sm text-gray-700"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="dropped">Dropped</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Child', 'Parent', 'Class', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {enrollments.isLoading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            )}
            {enrollments.data?.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No enrollments found.</td></tr>
            )}
            {enrollments.data?.map((en) => {
              const child = en.children as { first_name: string; last_name: string } | null;
              const cls = en.classes as { name: string; class_types: { name: string; color: string } | null } | null;
              const family = en.families as { parent_first_name: string; parent_last_name: string; email: string } | null;
              const childName = child ? `${child.first_name} ${child.last_name}` : '—';
              const className = cls?.name ?? '—';

              return (
                <tr key={en.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{childName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {family ? `${family.parent_first_name} ${family.parent_last_name}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {cls?.class_types && (
                      <span className="mr-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: cls.class_types.color }}>
                        {cls.class_types.name}
                      </span>
                    )}
                    {className}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {en.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(en.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {['active', 'pending', 'waitlisted'].includes(en.status) && (
                      <button
                        onClick={() => {
                          setActionTarget({ id: en.id, childName, className, currentStatus: en.status });
                          setNewStatus(en.status === 'pending' || en.status === 'waitlisted' ? 'active' : 'dropped');
                        }}
                        className="rounded px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50"
                      >
                        Update
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal */}
      <Modal open={!!actionTarget} onClose={() => setActionTarget(null)} title="Update Enrollment Status">
        {actionTarget && (
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
              <p><span className="font-medium">Child:</span> {actionTarget.childName}</p>
              <p><span className="font-medium">Class:</span> {actionTarget.className}</p>
              <p><span className="font-medium">Current:</span> {actionTarget.currentStatus}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'active' | 'dropped' | 'cancelled')}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="active">Active</option>
                <option value="dropped">Dropped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {newStatus === 'dropped' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
                <textarea
                  value={dropReason}
                  onChange={(e) => setDropReason(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                />
              </div>
            )}

            {updateMutation.error && (
              <p className="text-sm text-red-600">{updateMutation.error.message}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
              <button type="button" onClick={() => setActionTarget(null)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
