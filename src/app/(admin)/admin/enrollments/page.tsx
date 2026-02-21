'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { ChevronDown } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

type StatusAction = { id: string; childName: string; className: string; currentStatus: string };

function ShimmerRow() {
  return (
    <tr>
      {[...Array(6)].map((_, i) => (
        <td key={i} className="px-5 py-4"><div className="skeleton h-4 w-24" /></td>
      ))}
    </tr>
  );
}

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

  const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Enrollments</h1>
          <p className="mt-1 text-sm text-gray-500">View and manage class enrollments</p>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 appearance-none rounded-xl border border-gray-200 bg-white py-2 pl-4 pr-9 text-sm text-gray-700 transition-shadow input-glow"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="waitlisted">Waitlisted</option>
            <option value="dropped">Dropped</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/60">
              {['Student', 'Parent', 'Class', 'Status', 'Date', ''].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {enrollments.isLoading && (
              <>
                <ShimmerRow />
                <ShimmerRow />
                <ShimmerRow />
              </>
            )}
            {enrollments.data?.length === 0 && (
              <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-400">No enrollments found.</td></tr>
            )}
            {enrollments.data?.map((en) => {
              const child = en.children as { first_name: string; last_name: string } | null;
              const cls = en.classes as { name: string; class_types: { name: string; color: string } | null } | null;
              const family = en.families as { parent_first_name: string; parent_last_name: string; email: string } | null;
              const childName = child ? `${child.first_name} ${child.last_name}` : '—';
              const className = cls?.name ?? '—';

              return (
                <tr key={en.id} className="transition-colors hover:bg-indigo-50/40">
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{childName}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {family ? `${family.parent_first_name} ${family.parent_last_name}` : '—'}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {cls?.class_types && (
                      <span className="mr-1.5 inline-block rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ backgroundColor: cls.class_types.color }}>
                        {cls.class_types.name}
                      </span>
                    )}
                    {className}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {en.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-500">
                    {new Date(en.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {['active', 'pending', 'waitlisted'].includes(en.status) && (
                      <button
                        onClick={() => {
                          setActionTarget({ id: en.id, childName, className, currentStatus: en.status });
                          setNewStatus(en.status === 'pending' || en.status === 'waitlisted' ? 'active' : 'dropped');
                        }}
                        className="h-8 rounded-lg px-3 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
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
            <div className="rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-4 text-sm text-gray-700">
              <p><span className="font-medium">Student:</span> {actionTarget.childName}</p>
              <p><span className="font-medium">Class:</span> {actionTarget.className}</p>
              <p><span className="font-medium">Current:</span> {actionTarget.currentStatus}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">New Status</label>
              <select value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as 'active' | 'dropped' | 'cancelled')}
                className={inputClass}>
                <option value="active">Active</option>
                <option value="dropped">Dropped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {newStatus === 'dropped' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Reason (optional)</label>
                <textarea value={dropReason} onChange={(e) => setDropReason(e.target.value)}
                  rows={2} className={inputClass} />
              </div>
            )}

            {updateMutation.error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{updateMutation.error.message}</p>
            )}

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button type="button" onClick={() => setActionTarget(null)}
                className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={updateMutation.isPending}
                className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
                {updateMutation.isPending ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
