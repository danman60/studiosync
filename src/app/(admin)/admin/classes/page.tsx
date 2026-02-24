'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(t: string) {
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

type FormData = {
  name: string;
  description: string;
  season_id: string;
  class_type_id: string;
  level_id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string;
  capacity: number;
  monthly_price: string;
  drop_in_price: string;
  registration_fee: string;
  min_age: string;
  max_age: string;
  is_public: boolean;
  allow_drop_in: boolean;
};

const emptyForm: FormData = {
  name: '',
  description: '',
  season_id: '',
  class_type_id: '',
  level_id: '',
  instructor_id: '',
  day_of_week: 1,
  start_time: '09:00',
  end_time: '10:00',
  room: '',
  capacity: 20,
  monthly_price: '',
  drop_in_price: '',
  registration_fee: '',
  min_age: '',
  max_age: '',
  is_public: true,
  allow_drop_in: false,
};

export default function ClassesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);

  const utils = trpc.useUtils();
  const classes = trpc.admin.listClasses.useQuery();
  const seasons = trpc.admin.getSeasons.useQuery();
  const classTypes = trpc.admin.getClassTypes.useQuery();
  const levels = trpc.admin.getLevels.useQuery();
  const instructors = trpc.admin.getInstructors.useQuery();

  const createMutation = trpc.admin.createClass.useMutation({
    onSuccess: () => { utils.admin.listClasses.invalidate(); closeModal(); },
  });
  const updateMutation = trpc.admin.updateClass.useMutation({
    onSuccess: () => { utils.admin.listClasses.invalidate(); closeModal(); },
  });
  const deleteMutation = trpc.admin.deleteClass.useMutation({
    onSuccess: () => { utils.admin.listClasses.invalidate(); setDeleteId(null); },
  });

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function openCreate() {
    setForm({
      ...emptyForm,
      season_id: seasons.data?.[0]?.id ?? '',
      class_type_id: classTypes.data?.[0]?.id ?? '',
    });
    setEditingId(null);
    setModalOpen(true);
  }

  function openEdit(cls: NonNullable<typeof classes.data>[number]) {
    setForm({
      name: cls.name,
      description: cls.description ?? '',
      season_id: cls.season_id,
      class_type_id: cls.class_type_id,
      level_id: cls.level_id ?? '',
      instructor_id: cls.instructor_id ?? '',
      day_of_week: cls.day_of_week,
      start_time: cls.start_time.slice(0, 5),
      end_time: cls.end_time.slice(0, 5),
      room: cls.room ?? '',
      capacity: cls.capacity,
      monthly_price: cls.monthly_price != null ? String(cls.monthly_price) : '',
      drop_in_price: cls.drop_in_price != null ? String(cls.drop_in_price) : '',
      registration_fee: cls.registration_fee != null ? String(cls.registration_fee) : '',
      min_age: cls.min_age != null ? String(cls.min_age) : '',
      max_age: cls.max_age != null ? String(cls.max_age) : '',
      is_public: cls.is_public,
      allow_drop_in: cls.allow_drop_in,
    });
    setEditingId(cls.id);
    setModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      description: form.description || null,
      season_id: form.season_id,
      class_type_id: form.class_type_id,
      level_id: form.level_id || null,
      instructor_id: form.instructor_id || null,
      day_of_week: form.day_of_week,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room || null,
      capacity: form.capacity,
      monthly_price: form.monthly_price ? Number(form.monthly_price) : null,
      drop_in_price: form.drop_in_price ? Number(form.drop_in_price) : null,
      registration_fee: form.registration_fee ? Number(form.registration_fee) : null,
      min_age: form.min_age ? Number(form.min_age) : null,
      max_age: form.max_age ? Number(form.max_age) : null,
      is_public: form.is_public,
      allow_drop_in: form.allow_drop_in,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  const isSaving = createMutation.isPending || updateMutation.isPending;
  const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';
  const selectClass = inputClass;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Classes</h1>
          <p className="mt-1 text-sm text-stone-500">
            Manage your studio&apos;s class schedule
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <Plus size={16} /> Add Class
        </button>
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Name', 'Type', 'Level', 'Day / Time', 'Instructor', 'Enrolled', 'Season', ''].map(
                  (h) => (
                    <th key={h} className="table-header">{h}</th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {classes.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {classes.data?.length === 0 && (
                <tr>
                  <td colSpan={8} className="table-cell text-center py-10 text-stone-400">
                    No classes yet. Click &quot;Add Class&quot; to create one.
                  </td>
                </tr>
              )}
              {classes.data?.map((cls) => (
                <tr key={cls.id} className="table-row-hover">
                  <td className="table-cell font-medium text-stone-800">{cls.name}</td>
                  <td className="table-cell">
                    <span
                      className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: cls.class_types?.color ?? '#C2785C' }}
                    >
                      {cls.class_types?.name ?? '—'}
                    </span>
                  </td>
                  <td className="table-cell text-stone-600">{cls.levels?.name ?? '—'}</td>
                  <td className="table-cell text-stone-600">
                    {DAYS[cls.day_of_week]} {formatTime(cls.start_time)}–{formatTime(cls.end_time)}
                  </td>
                  <td className="table-cell text-stone-600">
                    {cls.staff?.display_name ?? '—'}
                  </td>
                  <td className="table-cell text-stone-600">
                    <span className="font-medium text-stone-800">{cls.enrolled_count}</span>
                    <span className="text-stone-400">/{cls.capacity}</span>
                  </td>
                  <td className="table-cell text-stone-600">
                    {cls.seasons?.name ?? '—'}
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cls)}
                        className="icon-btn"
                        title="Edit"
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        onClick={() => setDeleteId(cls.id)}
                        className="icon-btn icon-btn-danger"
                        title="Delete"
                      >
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
      <Modal open={modalOpen} onClose={closeModal} title={editingId ? 'Edit Class' : 'Add Class'} wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Name *</label>
            <input type="text" required value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Season *</label>
              <select required value={form.season_id}
                onChange={(e) => setForm({ ...form, season_id: e.target.value })}
                className={selectClass}>
                <option value="">Select...</option>
                {seasons.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Type *</label>
              <select required value={form.class_type_id}
                onChange={(e) => setForm({ ...form, class_type_id: e.target.value })}
                className={selectClass}>
                <option value="">Select...</option>
                {classTypes.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Level</label>
              <select value={form.level_id}
                onChange={(e) => setForm({ ...form, level_id: e.target.value })}
                className={selectClass}>
                <option value="">None</option>
                {levels.data?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Instructor</label>
              <select value={form.instructor_id}
                onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
                className={selectClass}>
                <option value="">None</option>
                {instructors.data?.map((i) => (
                  <option key={i.id} value={i.id}>{i.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Day *</label>
              <select required value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                className={selectClass}>
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Start *</label>
              <input type="time" required value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">End *</label>
              <input type="time" required value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Room</label>
              <input type="text" value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className={inputClass} placeholder="e.g. Studio A" />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Capacity</label>
              <input type="number" min={1} value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Monthly Price ($)</label>
              <input type="number" min={0} step="0.01" value={form.monthly_price}
                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Drop-in Price ($)</label>
              <input type="number" min={0} step="0.01" value={form.drop_in_price}
                onChange={(e) => setForm({ ...form, drop_in_price: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Reg. Fee ($)</label>
              <input type="number" min={0} step="0.01" value={form.registration_fee}
                onChange={(e) => setForm({ ...form, registration_fee: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-stone-700">Min Age</label>
              <input type="number" min={0} value={form.min_age}
                onChange={(e) => setForm({ ...form, min_age: e.target.value })}
                className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Max Age</label>
              <input type="number" min={0} value={form.max_age}
                onChange={(e) => setForm({ ...form, max_age: e.target.value })}
                className={inputClass} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2.5 text-sm text-stone-700">
              <input type="checkbox" checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary/30" />
              Public (visible in catalog)
            </label>
            <label className="flex items-center gap-2.5 text-sm text-stone-700">
              <input type="checkbox" checked={form.allow_drop_in}
                onChange={(e) => setForm({ ...form, allow_drop_in: e.target.checked })}
                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary/30" />
              Allow drop-in
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700">Description</label>
            <textarea rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass} />
          </div>

          {(createMutation.error || updateMutation.error) && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}

          <div className="flex justify-end gap-3 border-t border-stone-100 pt-4">
            <button type="button" onClick={closeModal}
              className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium">
              {isSaving ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Class">
        <p className="text-sm text-stone-600">
          Are you sure you want to delete this class? This action cannot be undone.
        </p>
        {deleteMutation.error && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{deleteMutation.error.message}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)}
            className="btn-outline h-11 rounded-xl px-5 text-sm font-medium">
            Cancel
          </button>
          <button onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            disabled={deleteMutation.isPending}
            className="btn-danger h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
