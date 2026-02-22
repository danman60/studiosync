'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { ChevronDown, ArrowUpCircle, Download, Upload } from 'lucide-react';
import Link from 'next/link';

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  waitlisted: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  dropped: 'bg-gray-500/15 text-gray-500 border border-gray-500/20',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

type StatusAction = { id: string; studentName: string; className: string; currentStatus: string };

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

  const promoteMutation = trpc.admin.promoteFromWaitlist.useMutation({
    onSuccess: () => {
      utils.admin.listEnrollments.invalidate();
    },
  });

  function exportCSV() {
    const rows = enrollments.data ?? [];
    if (rows.length === 0) return;
    const header = ['Student', 'Parent', 'Email', 'Class', 'Status', 'Date'];
    const csvRows = rows.map((en) => {
      const student = en.students as { first_name: string; last_name: string } | null;
      const cls = en.classes as { name: string } | null;
      const family = en.families as { parent_first_name: string; parent_last_name: string; email: string } | null;
      return [
        student ? `${student.first_name} ${student.last_name}` : '',
        family ? `${family.parent_first_name} ${family.parent_last_name}` : '',
        family?.email ?? '',
        cls?.name ?? '',
        en.status,
        new Date(en.created_at).toLocaleDateString(),
      ].map((v) => `"${v}"`).join(',');
    });
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

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
        <div className="flex items-center gap-3">
          <Link
            href="/admin/enrollments/import"
            className="btn-outline inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium"
          >
            <Upload size={16} /> Bulk Import
          </Link>
          <button
            onClick={exportCSV}
            disabled={!enrollments.data?.length}
            className="btn-outline inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-medium disabled:opacity-50"
          >
            <Download size={16} /> Export CSV
          </button>
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
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Student', 'Parent', 'Class', 'Status', 'Date', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {enrollments.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-24" /></td>
                  ))}
                </tr>
              ))}
              {enrollments.data?.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-gray-400">No enrollments found.</td></tr>
              )}
              {enrollments.data?.map((en) => {
                const student = en.students as { first_name: string; last_name: string } | null;
                const cls = en.classes as { name: string; class_types: { name: string; color: string } | null } | null;
                const family = en.families as { parent_first_name: string; parent_last_name: string; email: string } | null;
                const studentName = student ? `${student.first_name} ${student.last_name}` : '—';
                const className = cls?.name ?? '—';

                return (
                  <tr key={en.id} className="table-row-hover">
                    <td className="table-cell font-medium text-gray-900">{studentName}</td>
                    <td className="table-cell text-gray-600">
                      {family ? `${family.parent_first_name} ${family.parent_last_name}` : '—'}
                    </td>
                    <td className="table-cell text-gray-600">
                      {cls?.class_types && (
                        <span className="mr-1.5 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium text-white" style={{ backgroundColor: cls.class_types.color }}>
                          {cls.class_types.name}
                        </span>
                      )}
                      {className}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[en.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {en.status}
                      </span>
                    </td>
                    <td className="table-cell text-gray-500">
                      {new Date(en.created_at).toLocaleDateString()}
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end gap-1">
                        {en.status === 'waitlisted' && (
                          <button
                            onClick={() => promoteMutation.mutate({ enrollmentId: en.id })}
                            disabled={promoteMutation.isPending}
                            className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-50 disabled:opacity-50"
                            title="Promote to active"
                          >
                            <ArrowUpCircle size={14} /> Promote
                          </button>
                        )}
                        {['active', 'pending', 'waitlisted'].includes(en.status) && (
                          <button
                            onClick={() => {
                              setActionTarget({ id: en.id, studentName, className, currentStatus: en.status });
                              setNewStatus(en.status === 'pending' || en.status === 'waitlisted' ? 'active' : 'dropped');
                            }}
                            className="h-9 rounded-lg px-3 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {promoteMutation.isError && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {promoteMutation.error.message}
        </div>
      )}

      {/* Status Update Modal */}
      <Modal open={!!actionTarget} onClose={() => setActionTarget(null)} title="Update Enrollment Status">
        {actionTarget && (
          <form onSubmit={handleStatusUpdate} className="space-y-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-50/80 to-purple-50/50 p-4 text-sm text-gray-700">
              <p><span className="font-medium">Student:</span> {actionTarget.studentName}</p>
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
                className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">Cancel</button>
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
