'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';

type SeasonForm = {
  name: string;
  start_date: string;
  end_date: string;
  registration_opens_at: string;
  registration_closes_at: string;
  is_current: boolean;
};

const emptyForm: SeasonForm = {
  name: '',
  start_date: '',
  end_date: '',
  registration_opens_at: '',
  registration_closes_at: '',
  is_current: false,
};

export default function SeasonsPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<SeasonForm>(emptyForm);

  const utils = trpc.useUtils();
  const seasons = trpc.admin.getSeasons.useQuery();

  const createMutation = trpc.admin.createSeason.useMutation({
    onSuccess: () => { utils.admin.getSeasons.invalidate(); closeModal(); },
  });
  const updateMutation = trpc.admin.updateSeason.useMutation({
    onSuccess: () => { utils.admin.getSeasons.invalidate(); closeModal(); },
  });
  const deleteMutation = trpc.admin.deleteSeason.useMutation({
    onSuccess: () => { utils.admin.getSeasons.invalidate(); setDeleteId(null); },
  });

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setForm(emptyForm);
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(s: NonNullable<typeof seasons.data>[number]) {
    setForm({
      name: s.name,
      start_date: s.start_date,
      end_date: s.end_date,
      registration_opens_at: s.registration_opens_at ? s.registration_opens_at.slice(0, 16) : '',
      registration_closes_at: s.registration_closes_at ? s.registration_closes_at.slice(0, 16) : '',
      is_current: s.is_current,
    });
    setEditingId(s.id);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      start_date: form.start_date,
      end_date: form.end_date,
      registration_opens_at: form.registration_opens_at || null,
      registration_closes_at: form.registration_closes_at || null,
      is_current: form.is_current,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Seasons</h1>
          <p className="mt-1 text-sm text-gray-500">Manage registration seasons and terms</p>
        </div>
        <button onClick={openCreate}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          <Plus size={16} /> Add Season
        </button>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Name', 'Start', 'End', 'Registration Window', 'Status', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {seasons.isLoading && [1, 2].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {seasons.data?.length === 0 && (
                <tr><td colSpan={6} className="table-cell text-center py-10 text-gray-400">No seasons yet.</td></tr>
              )}
              {seasons.data?.map((s) => (
                <tr key={s.id} className="table-row-hover">
                  <td className="table-cell font-medium text-gray-900">
                    <span className="flex items-center gap-1.5">
                      {s.name}
                      {s.is_current && <Star size={14} className="fill-amber-400 text-amber-400" />}
                    </span>
                  </td>
                  <td className="table-cell text-gray-600">{s.start_date}</td>
                  <td className="table-cell text-gray-600">{s.end_date}</td>
                  <td className="table-cell text-gray-600">
                    {s.registration_opens_at
                      ? `${new Date(s.registration_opens_at).toLocaleDateString()} — ${s.registration_closes_at ? new Date(s.registration_closes_at).toLocaleDateString() : 'Open'}`
                      : '—'}
                  </td>
                  <td className="table-cell">
                    {s.is_current ? (
                      <span className="inline-block rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 border border-emerald-500/25">Current</span>
                    ) : (
                      <span className="inline-block rounded-full bg-gray-500/15 px-2.5 py-0.5 text-[11px] font-medium text-gray-500 border border-gray-500/20">Inactive</span>
                    )}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => openEdit(s)}
                        className="icon-btn" title="Edit">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setDeleteId(s.id)}
                        className="icon-btn icon-btn-danger" title="Delete">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Season' : 'Add Season'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} placeholder="e.g. Fall 2026" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Start Date *</label>
              <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End Date *</label>
              <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Opens</label>
              <input type="datetime-local" value={form.registration_opens_at} onChange={(e) => setForm({ ...form, registration_opens_at: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Registration Closes</label>
              <input type="datetime-local" value={form.registration_closes_at} onChange={(e) => setForm({ ...form, registration_closes_at: e.target.value })}
                className={inputClass} />
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={form.is_current} onChange={(e) => setForm({ ...form, is_current: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/30" />
            Set as current season
          </label>

          {(createMutation.error || updateMutation.error) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createMutation.error?.message || updateMutation.error?.message}</p>
          )}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button type="button" onClick={closeModal}
              className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">Cancel</button>
            <button type="submit" disabled={isSaving}
              className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
              {isSaving ? 'Saving...' : editingId ? 'Update Season' : 'Create Season'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Season">
        <p className="text-sm text-gray-600">Are you sure? Seasons with classes cannot be deleted.</p>
        {deleteMutation.error && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteMutation.error.message}</p>}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)}
            className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">Cancel</button>
          <button onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })} disabled={deleteMutation.isPending}
            className="btn-danger h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
