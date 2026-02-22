'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, Plus, Eye, Pencil, Trash2, Copy } from 'lucide-react';
import { Modal } from '@/components/admin/Modal';

const CATEGORY_BADGE: Record<string, string> = {
  general: 'bg-gray-500/15 text-gray-600',
  billing: 'bg-emerald-500/15 text-emerald-600',
  enrollment: 'bg-blue-500/15 text-blue-600',
  attendance: 'bg-amber-500/15 text-amber-600',
  announcement: 'bg-purple-500/15 text-purple-600',
  reminder: 'bg-orange-500/15 text-orange-600',
};

const CATEGORIES = ['general', 'billing', 'enrollment', 'attendance', 'announcement', 'reminder'] as const;

export default function AdminTemplatesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');

  const templates = trpc.messageTemplate.list.useQuery(
    filterCat ? { category: filterCat, activeOnly: false } : { activeOnly: false }
  );
  const utils = trpc.useUtils();

  const deleteMut = trpc.messageTemplate.delete.useMutation({
    onSuccess: () => utils.messageTemplate.list.invalidate(),
  });

  const toggleMut = trpc.messageTemplate.update.useMutation({
    onSuccess: () => utils.messageTemplate.list.invalidate(),
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Message Templates</h1>
          <p className="mt-1 text-sm text-gray-500">Reusable templates with merge fields for messaging.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          <Plus size={16} /> New Template
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setFilterCat('')} className={`filter-chip ${!filterCat ? 'filter-chip-active' : ''}`}>All</button>
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`filter-chip ${filterCat === c ? 'filter-chip-active' : ''}`}>
            {c.charAt(0).toUpperCase() + c.slice(1)}
          </button>
        ))}
      </div>

      {/* Template Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.isLoading && [1, 2, 3].map((i) => (
          <div key={i} className="glass-card-static rounded-2xl p-5">
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-16 w-full rounded-xl" />
          </div>
        ))}
        {templates.data?.length === 0 && (
          <div className="col-span-full empty-state">
            <FileText size={32} className="text-gray-300" />
            <p className="mt-3 text-sm text-gray-400">No templates yet. Create your first one.</p>
          </div>
        )}
        {templates.data?.map((t, idx) => (
          <div key={t.id} className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 8)} ${!t.is_active ? 'opacity-50' : ''}`}>
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{t.name}</h3>
                {t.subject && <p className="text-xs text-gray-500 mt-0.5">Subject: {t.subject}</p>}
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_BADGE[t.category] ?? ''}`}>
                {t.category}
              </span>
            </div>
            <p className="text-xs text-gray-500 line-clamp-3 mb-3">{t.body}</p>
            {t.merge_fields.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {t.merge_fields.map((f: string) => (
                  <span key={f} className="rounded bg-indigo-50 px-1.5 py-0.5 text-[10px] text-indigo-600 font-mono">{f}</span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-1 border-t border-gray-100 pt-3">
              <button onClick={() => setPreviewId(t.id)} className="icon-btn text-gray-400 hover:text-indigo-600" title="Preview">
                <Eye size={14} />
              </button>
              <button onClick={() => setEditId(t.id)} className="icon-btn text-gray-400 hover:text-indigo-600" title="Edit">
                <Pencil size={14} />
              </button>
              <button onClick={() => toggleMut.mutate({ id: t.id, is_active: !t.is_active })} className="icon-btn text-gray-400 hover:text-amber-600" title={t.is_active ? 'Deactivate' : 'Activate'}>
                {t.is_active ? '~' : '+'}
              </button>
              <button
                onClick={() => { if (confirm('Delete this template?')) deleteMut.mutate({ id: t.id }); }}
                className="icon-btn text-gray-400 hover:text-red-500"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(t.body)}
                className="icon-btn text-gray-400 hover:text-gray-600 ml-auto"
                title="Copy body"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editId) && (
        <TemplateFormModal
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
        />
      )}

      {/* Preview Modal */}
      {previewId && (
        <PreviewModal
          template={templates.data?.find((t) => t.id === previewId) ?? null}
          onClose={() => setPreviewId(null)}
        />
      )}
    </div>
  );
}

function TemplateFormModal({ editId, onClose }: { editId: string | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const templates = trpc.messageTemplate.list.useQuery({ activeOnly: false });
  const existing = editId ? templates.data?.find((t) => t.id === editId) : null;

  const [form, setForm] = useState({
    name: existing?.name ?? '',
    subject: existing?.subject ?? '',
    body: existing?.body ?? '',
    category: existing?.category ?? 'general',
    merge_fields: existing?.merge_fields ?? [] as string[],
  });

  const MERGE_OPTIONS = ['{first_name}', '{last_name}', '{family_name}', '{child_name}', '{class_name}', '{studio_name}', '{amount}', '{due_date}', '{event_name}', '{event_date}'];

  const createMut = trpc.messageTemplate.create.useMutation({
    onSuccess: () => { utils.messageTemplate.list.invalidate(); onClose(); },
  });
  const updateMut = trpc.messageTemplate.update.useMutation({
    onSuccess: () => { utils.messageTemplate.list.invalidate(); onClose(); },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      subject: form.subject || undefined,
      body: form.body,
      category: form.category as typeof CATEGORIES[number],
      merge_fields: form.merge_fields,
    };
    if (editId) {
      updateMut.mutate({ id: editId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  };

  const toggleField = (field: string) => {
    setForm((f) => ({
      ...f,
      merge_fields: f.merge_fields.includes(field)
        ? f.merge_fields.filter((mf: string) => mf !== field)
        : [...f.merge_fields, field],
    }));
  };

  const insertField = (field: string) => {
    setForm((f) => ({ ...f, body: f.body + field }));
    if (!form.merge_fields.includes(field)) toggleField(field);
  };

  return (
    <Modal open={true} onClose={onClose} title={editId ? 'Edit Template' : 'New Template'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Category</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow">
              {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Subject (optional)</label>
          <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" placeholder="e.g., Invoice Ready: {amount}" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Body</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} rows={5} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm input-glow font-mono" required />
        </div>

        {/* Merge field buttons */}
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Insert Merge Field</label>
          <div className="flex flex-wrap gap-1">
            {MERGE_OPTIONS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => insertField(f)}
                className={`rounded-lg px-2 py-1 text-[11px] font-mono transition-colors ${
                  form.merge_fields.includes(f)
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {(createMut.isError || updateMut.isError) && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createMut.error?.message ?? updateMut.error?.message}</p>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-11 rounded-xl border border-gray-200 px-5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={createMut.isPending || updateMut.isPending} className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {createMut.isPending || updateMut.isPending ? 'Saving...' : editId ? 'Update' : 'Create'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PreviewModal({ template, onClose }: { template: { body: string; subject?: string | null } | null; onClose: () => void }) {
  const preview = trpc.messageTemplate.preview.useQuery(
    { body: template?.body ?? '', subject: template?.subject ?? undefined },
    { enabled: !!template }
  );

  return (
    <Modal open={true} onClose={onClose} title="Template Preview">
      <div className="space-y-3">
        {preview.data?.subject && (
          <div>
            <label className="text-xs font-medium text-gray-500">Subject</label>
            <p className="text-sm font-medium text-gray-900">{preview.data.subject}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-gray-500">Body</label>
          <div className="mt-1 rounded-xl bg-gray-50 p-4 text-sm text-gray-700 whitespace-pre-wrap">
            {preview.data?.body ?? 'Loading...'}
          </div>
        </div>
        <p className="text-xs text-gray-400 italic">Merge fields shown with sample data.</p>
      </div>
    </Modal>
  );
}
