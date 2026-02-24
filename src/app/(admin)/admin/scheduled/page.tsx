'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Modal } from '@/components/admin/Modal';
import { Send, Plus, Pencil, XCircle, Trash2 } from 'lucide-react';

type MessageForm = {
  subject: string;
  body: string;
  channel: 'email' | 'sms';
  scheduled_at: string;
  target_type: 'all' | 'class' | 'level' | 'class_type' | 'tag';
  target_id: string;
  target_tag: string;
  template_id: string;
};

const emptyForm: MessageForm = {
  subject: '',
  body: '',
  channel: 'email',
  scheduled_at: '',
  target_type: 'all',
  target_id: '',
  target_tag: '',
  template_id: '',
};

const STATUS_BADGE: Record<string, string> = {
  scheduled: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  sent: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  cancelled: 'bg-stone-500/15 text-stone-500 border border-stone-500/25',
  failed: 'bg-red-500/15 text-red-600 border border-red-500/25',
};

export default function ScheduledMessagesPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<MessageForm>(emptyForm);

  const utils = trpc.useUtils();

  const messages = trpc.scheduledMessage.list.useQuery(
    statusFilter ? { status: statusFilter as 'scheduled' | 'sent' | 'cancelled' | 'failed' } : undefined,
  );
  const classes = trpc.admin.listClasses.useQuery(undefined, { enabled: form.target_type === 'class' });
  const tags = trpc.familyTag.allTags.useQuery(undefined, { enabled: form.target_type === 'tag' });
  const templates = trpc.messageTemplate.list.useQuery();

  const createMut = trpc.scheduledMessage.create.useMutation({
    onSuccess: () => { utils.scheduledMessage.list.invalidate(); setCreateOpen(false); setForm(emptyForm); },
  });
  const updateMut = trpc.scheduledMessage.update.useMutation({
    onSuccess: () => { utils.scheduledMessage.list.invalidate(); setEditId(null); setForm(emptyForm); },
  });
  const cancelMut = trpc.scheduledMessage.cancel.useMutation({
    onSuccess: () => utils.scheduledMessage.list.invalidate(),
  });
  const deleteMut = trpc.scheduledMessage.delete.useMutation({
    onSuccess: () => utils.scheduledMessage.list.invalidate(),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      subject: form.subject,
      body: form.body,
      channel: form.channel,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      target_type: form.target_type,
      target_id: form.target_id || undefined,
      target_tag: form.target_tag || undefined,
      template_id: form.template_id || undefined,
    };

    if (editId) {
      updateMut.mutate({ id: editId, ...payload });
    } else {
      createMut.mutate(payload);
    }
  }

  function openEdit(msg: Record<string, unknown>) {
    setEditId(msg.id as string);
    const scheduledAt = new Date(msg.scheduled_at as string);
    setForm({
      subject: msg.subject as string,
      body: msg.body as string,
      channel: (msg.channel as 'email' | 'sms') ?? 'email',
      scheduled_at: scheduledAt.toISOString().slice(0, 16),
      target_type: (msg.target_type as MessageForm['target_type']) ?? 'all',
      target_id: (msg.target_id as string) ?? '',
      target_tag: (msg.target_tag as string) ?? '',
      template_id: (msg.template_id as string) ?? '',
    });
    setCreateOpen(true);
  }

  const isFormOpen = createOpen || !!editId;
  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-800">Scheduled Messages</h1>
          <p className="text-sm text-stone-500 mt-1">Schedule messages to be sent automatically</p>
        </div>
        <button
          onClick={() => { setEditId(null); setForm(emptyForm); setCreateOpen(true); }}
          className="btn-primary flex items-center gap-1.5 text-sm"
        >
          <Plus size={16} /> Schedule Message
        </button>
      </div>

      {/* Status filter */}
      <div className="mb-4 flex gap-2">
        {['', 'scheduled', 'sent', 'cancelled', 'failed'].map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary-100 text-primary-dark'
                : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
            }`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={isFormOpen}
        onClose={() => { setCreateOpen(false); setEditId(null); setForm(emptyForm); }}
        title={editId ? 'Edit Scheduled Message' : 'Schedule New Message'}
        wide
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input
              type="text"
              className="input-field w-full"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="label">Body</label>
            <textarea
              className="input-field w-full"
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={4}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Channel</label>
              <select
                className="input-field w-full"
                value={form.channel}
                onChange={e => setForm({ ...form, channel: e.target.value as 'email' | 'sms' })}
              >
                <option value="email">Email</option>
                <option value="sms">SMS</option>
              </select>
            </div>
            <div>
              <label className="label">Send At</label>
              <input
                type="datetime-local"
                className="input-field w-full"
                value={form.scheduled_at}
                onChange={e => setForm({ ...form, scheduled_at: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Target</label>
              <select
                className="input-field w-full"
                value={form.target_type}
                onChange={e => setForm({ ...form, target_type: e.target.value as MessageForm['target_type'], target_id: '', target_tag: '' })}
              >
                <option value="all">All Families</option>
                <option value="class">Specific Class</option>
                <option value="tag">By Tag</option>
              </select>
            </div>
            {form.target_type === 'class' && (
              <div>
                <label className="label">Class</label>
                <select
                  className="input-field w-full"
                  value={form.target_id}
                  onChange={e => setForm({ ...form, target_id: e.target.value })}
                  required
                >
                  <option value="">Select class...</option>
                  {(classes.data ?? []).map((c: { id: string; name: string }) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            )}
            {form.target_type === 'tag' && (
              <div>
                <label className="label">Tag</label>
                <select
                  className="input-field w-full"
                  value={form.target_tag}
                  onChange={e => setForm({ ...form, target_tag: e.target.value })}
                  required
                >
                  <option value="">Select tag...</option>
                  {(tags.data ?? []).map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
          <div>
            <label className="label">Template (optional)</label>
            <select
              className="input-field w-full"
              value={form.template_id}
              onChange={e => {
                const tmpl = (templates.data ?? []).find((t: { id: string }) => t.id === e.target.value);
                if (tmpl) {
                  setForm({
                    ...form,
                    template_id: e.target.value,
                    subject: (tmpl as { subject?: string }).subject || form.subject,
                    body: (tmpl as { body: string }).body || form.body,
                  });
                } else {
                  setForm({ ...form, template_id: e.target.value });
                }
              }}
            >
              <option value="">None</option>
              {(templates.data ?? []).map((t: { id: string; name: string }) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary w-full" disabled={isSaving}>
            {isSaving ? 'Saving...' : editId ? 'Update Message' : 'Schedule Message'}
          </button>
          {(createMut.error || updateMut.error) && (
            <p className="text-sm text-red-500">{createMut.error?.message || updateMut.error?.message}</p>
          )}
        </form>
      </Modal>

      {/* Messages List */}
      <div className="rounded-2xl bg-white border border-stone-200/60 shadow-sm overflow-hidden">
        {messages.isLoading ? (
          <div className="p-8 text-center text-stone-400">Loading...</div>
        ) : (messages.data ?? []).length === 0 ? (
          <div className="p-8 text-center">
            <Send size={32} className="mx-auto text-stone-300 mb-2" />
            <p className="text-stone-400 text-sm">No scheduled messages yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-stone-50/50 text-left text-xs text-stone-500 uppercase tracking-wider">
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Target</th>
                <th className="px-4 py-3">Scheduled</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Recipients</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(messages.data ?? []).map(msg => {
                const authorInfo = msg.staff as unknown as { display_name: string } | null;
                return (
                  <tr key={msg.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-800 truncate max-w-[200px]">{msg.subject}</div>
                      {authorInfo && (
                        <div className="text-xs text-stone-400">by {authorInfo.display_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600 capitalize">{msg.channel}</td>
                    <td className="px-4 py-3 text-stone-600 capitalize">
                      {msg.target_type === 'tag' ? `Tag: ${msg.target_tag}` : msg.target_type}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {new Date(msg.scheduled_at).toLocaleString('en-US', {
                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_BADGE[msg.status] ?? ''}`}>
                        {msg.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-stone-600">{msg.recipient_count ?? '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        {msg.status === 'scheduled' && (
                          <>
                            <button onClick={() => openEdit(msg)} className="icon-btn" title="Edit">
                              <Pencil size={14} />
                            </button>
                            <button
                              onClick={() => { if (confirm('Cancel this message?')) cancelMut.mutate({ id: msg.id }); }}
                              className="icon-btn text-amber-500 hover:text-amber-600"
                              title="Cancel"
                            >
                              <XCircle size={14} />
                            </button>
                          </>
                        )}
                        {['cancelled', 'sent', 'failed'].includes(msg.status) && (
                          <button
                            onClick={() => { if (confirm('Delete this message?')) deleteMut.mutate({ id: msg.id }); }}
                            className="icon-btn text-red-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
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
