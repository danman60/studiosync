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

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your studio&apos;s class schedule
          </p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <Plus size={16} /> Add Class
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Type', 'Level', 'Day / Time', 'Instructor', 'Enrolled', 'Season', ''].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {classes.isLoading && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  Loading...
                </td>
              </tr>
            )}
            {classes.data?.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-gray-400">
                  No classes yet. Click &quot;Add Class&quot; to create one.
                </td>
              </tr>
            )}
            {classes.data?.map((cls) => (
              <tr key={cls.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">{cls.name}</td>
                <td className="px-4 py-3">
                  <span
                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                    style={{ backgroundColor: cls.class_types?.color ?? '#6366f1' }}
                  >
                    {cls.class_types?.name ?? '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{cls.levels?.name ?? '—'}</td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {DAYS[cls.day_of_week]} {formatTime(cls.start_time)}–{formatTime(cls.end_time)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {cls.staff?.display_name ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {cls.enrolled_count}/{cls.capacity}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {cls.seasons?.name ?? '—'}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => openEdit(cls)}
                      className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-indigo-600"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(cls.id)}
                      className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"
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

      {/* Create/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editingId ? 'Edit Class' : 'Add Class'}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Name *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Row 2: Season, Type, Level */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Season *</label>
              <select
                required
                value={form.season_id}
                onChange={(e) => setForm({ ...form, season_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select...</option>
                {seasons.data?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Type *</label>
              <select
                required
                value={form.class_type_id}
                onChange={(e) => setForm({ ...form, class_type_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="">Select...</option>
                {classTypes.data?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Level</label>
              <select
                value={form.level_id}
                onChange={(e) => setForm({ ...form, level_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="">None</option>
                {levels.data?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Instructor, Day, Times */}
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Instructor</label>
              <select
                value={form.instructor_id}
                onChange={(e) => setForm({ ...form, instructor_id: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                <option value="">None</option>
                {instructors.data?.map((i) => (
                  <option key={i.id} value={i.id}>{i.display_name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Day *</label>
              <select
                required
                value={form.day_of_week}
                onChange={(e) => setForm({ ...form, day_of_week: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              >
                {DAYS.map((d, i) => (
                  <option key={i} value={i}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Start *</label>
              <input
                type="time"
                required
                value={form.start_time}
                onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">End *</label>
              <input
                type="time"
                required
                value={form.end_time}
                onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Row 4: Room, Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Room</label>
              <input
                type="text"
                value={form.room}
                onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
                placeholder="e.g. Studio A"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: Number(e.target.value) })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Row 5: Prices */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Monthly Price ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.monthly_price}
                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Drop-in Price ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.drop_in_price}
                onChange={(e) => setForm({ ...form, drop_in_price: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Reg. Fee ($)</label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.registration_fee}
                onChange={(e) => setForm({ ...form, registration_fee: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Row 6: Age range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">Min Age</label>
              <input
                type="number"
                min={0}
                value={form.min_age}
                onChange={(e) => setForm({ ...form, min_age: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Max Age</label>
              <input
                type="number"
                min={0}
                value={form.max_age}
                onChange={(e) => setForm({ ...form, max_age: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
              />
            </div>
          </div>

          {/* Row 7: Toggles */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.is_public}
                onChange={(e) => setForm({ ...form, is_public: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Public (visible in catalog)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={form.allow_drop_in}
                onChange={(e) => setForm({ ...form, allow_drop_in: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
              />
              Allow drop-in
            </label>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900"
            />
          </div>

          {/* Error */}
          {(createMutation.error || updateMutation.error) && (
            <p className="text-sm text-red-600">
              {createMutation.error?.message || updateMutation.error?.message}
            </p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : editingId ? 'Update Class' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Class">
        <p className="text-sm text-gray-600">
          Are you sure you want to delete this class? This action cannot be undone.
        </p>
        {deleteMutation.error && (
          <p className="mt-2 text-sm text-red-600">{deleteMutation.error.message}</p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setDeleteId(null)}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteId && deleteMutation.mutate({ id: deleteId })}
            disabled={deleteMutation.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
