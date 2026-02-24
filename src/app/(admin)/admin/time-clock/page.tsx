'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Clock, Pencil, Trash2, Download } from 'lucide-react';

function formatDuration(minutes: number | null): string {
  if (minutes == null) return 'In progress';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

type EditForm = {
  id: string;
  clock_in: string;
  clock_out: string;
  notes: string;
};

export default function AdminTimeClockPage() {
  const [staffFilter, setStaffFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editTarget, setEditTarget] = useState<EditForm | null>(null);
  const [summaryRange, setSummaryRange] = useState<{ start: string; end: string } | null>(null);

  const utils = trpc.useUtils();

  const entries = trpc.timeClock.allEntries.useQuery({
    staffId: staffFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const staff = trpc.admin.listStaff.useQuery();

  const summary = trpc.timeClock.summary.useQuery(
    { startDate: summaryRange?.start ?? '', endDate: summaryRange?.end ?? '' },
    { enabled: !!summaryRange },
  );

  const editMut = trpc.timeClock.editEntry.useMutation({
    onSuccess: () => { utils.timeClock.allEntries.invalidate(); setEditTarget(null); },
  });

  const deleteMut = trpc.timeClock.deleteEntry.useMutation({
    onSuccess: () => utils.timeClock.allEntries.invalidate(),
  });

  function handleExportCSV() {
    const rows = entries.data ?? [];
    const header = 'Staff,Clock In,Clock Out,Duration (min),Notes';
    const csv = rows.map(r => {
      const staffInfo = r.staff as unknown as { display_name: string } | null;
      return [
        staffInfo?.display_name ?? '',
        r.clock_in,
        r.clock_out ?? '',
        r.duration_minutes ?? '',
        (r.notes ?? '').replace(/,/g, ';'),
      ].join(',');
    });
    const blob = new Blob([header + '\n' + csv.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `time-clock-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Default summary range: current week
  function showWeeklySummary() {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setDate(now.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    setSummaryRange({
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Time Clock</h1>
          <p className="text-sm text-stone-500 mt-1">Track staff hours and attendance</p>
        </div>
        <div className="flex gap-2">
          <button onClick={showWeeklySummary} className="btn-secondary text-sm">
            Weekly Summary
          </button>
          <button onClick={handleExportCSV} className="btn-secondary text-sm flex items-center gap-1.5">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-3">
        <select
          value={staffFilter}
          onChange={e => setStaffFilter(e.target.value)}
          className="input-field w-48"
        >
          <option value="">All Staff</option>
          {(staff.data ?? []).filter(s => s.active).map(s => (
            <option key={s.id} value={s.id}>{s.display_name}</option>
          ))}
        </select>
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          className="input-field w-40"
          placeholder="Start date"
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
          className="input-field w-40"
          placeholder="End date"
        />
        {(staffFilter || startDate || endDate) && (
          <button
            onClick={() => { setStaffFilter(''); setStartDate(''); setEndDate(''); }}
            className="text-sm text-primary hover:text-primary-dark"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary Modal */}
      {summaryRange && (
        <Modal open={!!summaryRange} onClose={() => setSummaryRange(null)} title="Weekly Hours Summary" wide>
          {summary.isLoading ? (
            <p className="text-stone-500 text-sm">Loading...</p>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-stone-500">
                {summaryRange.start} to {summaryRange.end}
              </p>
              {(summary.data ?? []).length === 0 ? (
                <p className="text-sm text-stone-400">No entries for this period.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-stone-500">
                      <th className="pb-2">Staff</th>
                      <th className="pb-2">Entries</th>
                      <th className="pb-2 text-right">Total Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(summary.data ?? []).map(s => (
                      <tr key={s.staffId} className="border-b border-stone-50">
                        <td className="py-2 font-medium text-stone-800">{s.displayName}</td>
                        <td className="py-2 text-stone-600">{s.entryCount}</td>
                        <td className="py-2 text-right text-stone-800">
                          {(s.totalMinutes / 60).toFixed(1)}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* Edit Modal */}
      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Time Entry">
        {editTarget && (
          <form
            onSubmit={e => {
              e.preventDefault();
              editMut.mutate({
                id: editTarget.id,
                clock_in: new Date(editTarget.clock_in).toISOString(),
                clock_out: editTarget.clock_out ? new Date(editTarget.clock_out).toISOString() : null,
                notes: editTarget.notes || null,
              });
            }}
            className="space-y-4"
          >
            <div>
              <label className="label">Clock In</label>
              <input
                type="datetime-local"
                className="input-field w-full"
                value={editTarget.clock_in}
                onChange={e => setEditTarget({ ...editTarget, clock_in: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="label">Clock Out</label>
              <input
                type="datetime-local"
                className="input-field w-full"
                value={editTarget.clock_out}
                onChange={e => setEditTarget({ ...editTarget, clock_out: e.target.value })}
              />
            </div>
            <div>
              <label className="label">Notes</label>
              <textarea
                className="input-field w-full"
                value={editTarget.notes}
                onChange={e => setEditTarget({ ...editTarget, notes: e.target.value })}
                rows={2}
              />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={editMut.isPending}>
              {editMut.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </Modal>

      {/* Entries Table */}
      <div className="rounded-2xl bg-white border border-stone-200/60 shadow-sm overflow-hidden">
        {entries.isLoading ? (
          <div className="p-8 text-center text-stone-400">Loading...</div>
        ) : (entries.data ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-stone-400 text-sm">No time clock entries found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50/50 text-left text-xs text-stone-500 uppercase tracking-wider">
                <th className="px-4 py-3">Staff</th>
                <th className="px-4 py-3">Clock In</th>
                <th className="px-4 py-3">Clock Out</th>
                <th className="px-4 py-3">Duration</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(entries.data ?? []).map(entry => {
                const staffInfo = entry.staff as unknown as { display_name: string; role: string } | null;
                return (
                  <tr key={entry.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800">{staffInfo?.display_name ?? '—'}</div>
                      <div className="text-xs text-stone-400">{staffInfo?.role ?? ''}</div>
                    </td>
                    <td className="px-4 py-3 text-stone-700">{formatDateTime(entry.clock_in)}</td>
                    <td className="px-4 py-3 text-stone-700">
                      {entry.clock_out ? formatDateTime(entry.clock_out) : (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-medium">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-700">{formatDuration(entry.duration_minutes)}</td>
                    <td className="px-4 py-3 text-stone-500 max-w-[200px] truncate">{entry.notes ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            const ci = new Date(entry.clock_in);
                            const co = entry.clock_out ? new Date(entry.clock_out) : null;
                            setEditTarget({
                              id: entry.id,
                              clock_in: ci.toISOString().slice(0, 16),
                              clock_out: co ? co.toISOString().slice(0, 16) : '',
                              notes: entry.notes ?? '',
                            });
                          }}
                          className="icon-btn"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Delete this time entry?')) {
                              deleteMut.mutate({ id: entry.id });
                            }
                          }}
                          className="icon-btn text-red-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
