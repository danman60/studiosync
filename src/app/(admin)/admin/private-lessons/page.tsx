'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Calendar, Clock, DollarSign, Plus, CheckCircle, XCircle } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  completed: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  cancelled: 'bg-gray-500/15 text-gray-600 border border-gray-500/25',
  no_show: 'bg-red-500/15 text-red-600 border border-red-500/25',
};


function formatCents(c: number) {
  return `$${(c / 100).toFixed(2)}`;
}

export default function AdminPrivateLessonsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed'>('all');
  const stats = trpc.privateLesson.stats.useQuery();
  const lessons = trpc.privateLesson.list.useQuery(
    filter === 'all' ? undefined : { status: filter as 'scheduled' | 'completed' }
  );
  const staff = trpc.admin.listStaff.useQuery();
  const families = trpc.admin.listFamilies.useQuery();
  const utils = trpc.useUtils();

  const updateMut = trpc.privateLesson.update.useMutation({
    onSuccess: () => {
      utils.privateLesson.list.invalidate();
      utils.privateLesson.stats.invalidate();
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Private Lessons</h1>
          <p className="mt-1 text-sm text-gray-500">Schedule and manage one-on-one lessons.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          <Plus size={16} /> New Lesson
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="glass-card rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <Calendar size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data?.total ?? 0}</p>
              <p className="text-xs text-gray-500">Total Lessons</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
              <Clock size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data?.upcoming ?? 0}</p>
              <p className="text-xs text-gray-500">Upcoming</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="stat-number">{formatCents(stats.data?.completedRevenue ?? 0)}</p>
              <p className="text-xs text-gray-500">Revenue (Completed)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 mb-4">
        {(['all', 'scheduled', 'completed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`filter-chip ${filter === f ? 'filter-chip-active' : ''}`}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead>
              <tr className="bg-gray-50/60">
                {['Date', 'Time', 'Student', 'Instructor', 'Price', 'Status', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lessons.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {lessons.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-14">
                    <Calendar size={32} className="mx-auto text-gray-300" />
                    <p className="mt-3 text-sm text-gray-400">No private lessons found.</p>
                  </td>
                </tr>
              )}
              {lessons.data?.map((l) => {
                const student = l.students as unknown as { first_name: string; last_name: string } | null;
                const instructor = l.staff as unknown as { display_name: string } | null;
                return (
                  <tr key={l.id} className="table-row-hover">
                    <td className="table-cell font-medium text-gray-900">{l.lesson_date}</td>
                    <td className="table-cell text-gray-600">{l.start_time.slice(0, 5)} - {l.end_time.slice(0, 5)}</td>
                    <td className="table-cell text-gray-600">{student ? `${student.first_name} ${student.last_name}` : '—'}</td>
                    <td className="table-cell text-gray-600">{instructor?.display_name ?? '—'}</td>
                    <td className="table-cell text-gray-600">{formatCents(l.price)}</td>
                    <td className="table-cell">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[l.status] ?? ''}`}>
                        {l.status}
                      </span>
                    </td>
                    <td className="table-cell">
                      {l.status === 'scheduled' && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => updateMut.mutate({ id: l.id, status: 'completed' })}
                            className="icon-btn text-emerald-500 hover:text-emerald-700"
                            title="Mark Completed"
                          >
                            <CheckCircle size={16} />
                          </button>
                          <button
                            onClick={() => updateMut.mutate({ id: l.id, status: 'cancelled' })}
                            className="icon-btn text-gray-400 hover:text-red-500"
                            title="Cancel"
                          >
                            <XCircle size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <CreateLessonModal
          onClose={() => setShowCreate(false)}
          staff={staff.data ?? []}
          families={families.data ?? []}
        />
      )}
    </div>
  );
}

function CreateLessonModal({
  onClose,
  staff,
  families,
}: {
  onClose: () => void;
  staff: Array<{ id: string; display_name: string; role: string }>;
  families: Array<{ id: string; parent_first_name: string; parent_last_name: string; students?: Array<{ id: string; first_name: string; last_name: string }> }>;
}) {
  const utils = trpc.useUtils();
  const [form, setForm] = useState({
    instructor_id: '',
    family_id: '',
    student_id: '',
    lesson_date: '',
    start_time: '09:00',
    end_time: '09:30',
    duration_minutes: '30',
    price: '',
    title: '',
    location: '',
    notes: '',
    recurring: false,
    recurrence_rule: 'weekly',
    recurrence_count: '4',
  });

  const createMut = trpc.privateLesson.create.useMutation({
    onSuccess: () => {
      utils.privateLesson.list.invalidate();
      utils.privateLesson.stats.invalidate();
      onClose();
    },
  });

  const instructors = staff.filter((s) => s.role === 'instructor' || s.role === 'owner' || s.role === 'admin');
  const selectedFamily = families.find((f) => f.id === form.family_id);
  const students = (selectedFamily?.students ?? []) as Array<{ id: string; first_name: string; last_name: string }>;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({
      instructor_id: form.instructor_id,
      family_id: form.family_id,
      student_id: form.student_id,
      lesson_date: form.lesson_date,
      start_time: form.start_time,
      end_time: form.end_time,
      duration_minutes: parseInt(form.duration_minutes) || 30,
      price: Math.round(parseFloat(form.price || '0') * 100),
      title: form.title || undefined,
      location: form.location || undefined,
      notes: form.notes || undefined,
      recurring: form.recurring,
      recurrence_rule: form.recurring ? (form.recurrence_rule as 'weekly' | 'biweekly' | 'monthly') : undefined,
      recurrence_count: form.recurring ? parseInt(form.recurrence_count) || 4 : undefined,
    });
  };

  return (
    <Modal open={true} onClose={onClose} title="Schedule Private Lesson">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Instructor</label>
            <select value={form.instructor_id} onChange={(e) => setForm({ ...form, instructor_id: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required>
              <option value="">Select...</option>
              {instructors.map((s) => <option key={s.id} value={s.id}>{s.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Family</label>
            <select value={form.family_id} onChange={(e) => setForm({ ...form, family_id: e.target.value, student_id: '' })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required>
              <option value="">Select...</option>
              {families.map((f) => <option key={f.id} value={f.id}>{f.parent_first_name} {f.parent_last_name}</option>)}
            </select>
          </div>
        </div>

        {students.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Student</label>
            <select value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required>
              <option value="">Select student...</option>
              {students.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date</label>
            <input type="date" value={form.lesson_date} onChange={(e) => setForm({ ...form, lesson_date: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Start</label>
            <input type="time" value={form.start_time} onChange={(e) => setForm({ ...form, start_time: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">End</label>
            <input type="time" value={form.end_time} onChange={(e) => setForm({ ...form, end_time: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Duration (min)</label>
            <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Price ($)</label>
            <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" placeholder="0.00" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
            <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" placeholder="Studio A" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Title (optional)</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" placeholder="Private Lesson" />
        </div>

        {/* Recurring toggle */}
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 px-4 py-3">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={form.recurring} onChange={(e) => setForm({ ...form, recurring: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600" />
            Recurring
          </label>
          {form.recurring && (
            <div className="flex items-center gap-2 ml-4">
              <select value={form.recurrence_rule} onChange={(e) => setForm({ ...form, recurrence_rule: e.target.value })} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm">
                <option value="weekly">Weekly</option>
                <option value="biweekly">Biweekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <span className="text-xs text-gray-500">x</span>
              <input type="number" min="2" max="52" value={form.recurrence_count} onChange={(e) => setForm({ ...form, recurrence_count: e.target.value })} className="h-9 w-16 rounded-lg border border-gray-200 bg-white px-2 text-sm text-center" />
              <span className="text-xs text-gray-500">times</span>
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Notes</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm input-glow" />
        </div>

        {createMut.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createMut.error.message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMut.isPending} className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {createMut.isPending ? 'Scheduling...' : form.recurring ? `Schedule ${form.recurrence_count} Lessons` : 'Schedule Lesson'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
