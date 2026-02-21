'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Megaphone,
  Plus,
  Send,
  Trash2,
  EyeOff,
  Globe,
  BookOpen,
  Layers,
  GraduationCap,
} from 'lucide-react';
import { Modal } from '@/components/admin/Modal';

const TARGET_ICON: Record<string, React.ReactNode> = {
  all: <Globe size={13} />,
  class: <BookOpen size={13} />,
  class_type: <Layers size={13} />,
  level: <GraduationCap size={13} />,
};

export default function AnnouncementsPage() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: announcements, isLoading } = trpc.announcement.list.useQuery();
  const createMut = trpc.announcement.create.useMutation({ onSuccess: () => { utils.announcement.list.invalidate(); setShowCreate(false); } });
  const publishMut = trpc.announcement.publish.useMutation({ onSuccess: () => utils.announcement.list.invalidate() });
  const unpublishMut = trpc.announcement.unpublish.useMutation({ onSuccess: () => utils.announcement.list.invalidate() });
  const deleteMut = trpc.announcement.delete.useMutation({ onSuccess: () => utils.announcement.list.invalidate() });

  // For target selection
  const { data: classes } = trpc.admin.listClasses.useQuery();
  const { data: classTypes } = trpc.admin.getClassTypes.useQuery();
  const { data: levels } = trpc.admin.getLevels.useQuery();

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Announcements</h1>
          <p className="mt-1 text-sm text-gray-500">Send targeted messages to families and staff.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/60 bg-white/80 p-5">
              <div className="mb-2 h-5 w-48 rounded bg-gray-200/60" />
              <div className="h-4 w-full rounded bg-gray-200/40" />
            </div>
          ))}
        </div>
      )}

      {/* Announcements list */}
      {!isLoading && (announcements ?? []).length > 0 && (
        <div className="space-y-3">
          {(announcements ?? []).map((ann, idx) => {
            const author = ann.staff as unknown as { display_name: string } | null;
            return (
              <div
                key={ann.id}
                className="group rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                      {ann.is_draft ? (
                        <span className="rounded-full bg-gray-500/15 border border-gray-500/20 px-2 py-0.5 text-[10px] font-medium text-gray-500">Draft</span>
                      ) : (
                        <span className="rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-600">Published</span>
                      )}
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-gray-600">{ann.body}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
                      <span className="inline-flex items-center gap-1">
                        {TARGET_ICON[ann.target_type]} {ann.target_type === 'all' ? 'Everyone' : ann.target_type.replace('_', ' ')}
                      </span>
                      {author && <span>by {author.display_name}</span>}
                      <span>{new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1">
                    {ann.is_draft ? (
                      <button
                        onClick={() => publishMut.mutate({ id: ann.id })}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500/10 px-3 text-xs font-medium text-emerald-600 hover:bg-emerald-500/20"
                        title="Publish"
                      >
                        <Send size={13} /> Publish
                      </button>
                    ) : (
                      <button
                        onClick={() => unpublishMut.mutate({ id: ann.id })}
                        className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-gray-100 px-3 text-xs font-medium text-gray-600 hover:bg-gray-200"
                        title="Unpublish"
                      >
                        <EyeOff size={13} /> Unpublish
                      </button>
                    )}
                    <button
                      onClick={() => { if (confirm('Delete this announcement?')) deleteMut.mutate({ id: ann.id }); }}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (announcements ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-20">
          <Megaphone size={24} className="mb-3 text-indigo-400" />
          <p className="text-sm font-medium text-gray-600">No announcements yet</p>
          <p className="mt-1 text-xs text-gray-400">Create your first announcement to communicate with families.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateAnnouncementModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
          classes={classes ?? []}
          classTypes={classTypes ?? []}
          levels={levels ?? []}
        />
      )}
    </div>
  );
}

function CreateAnnouncementModal({
  onClose,
  onSubmit,
  loading,
  classes,
  classTypes,
  levels,
}: {
  onClose: () => void;
  onSubmit: (data: { title: string; body: string; target_type: 'all' | 'class' | 'level' | 'class_type'; target_id?: string; publish: boolean }) => void;
  loading: boolean;
  classes: { id: string; name: string }[];
  classTypes: { id: string; name: string }[];
  levels: { id: string; name: string }[];
}) {
  const [form, setForm] = useState({ title: '', body: '', target_type: 'all' as 'all' | 'class' | 'level' | 'class_type', target_id: '', publish: false });

  const targetOptions = form.target_type === 'class' ? classes : form.target_type === 'class_type' ? classTypes : form.target_type === 'level' ? levels : [];

  return (
    <Modal open={true} onClose={onClose} title="New Announcement">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            title: form.title,
            body: form.body,
            target_type: form.target_type,
            target_id: form.target_id || undefined,
            publish: form.publish,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Title *</label>
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Message *</label>
          <textarea value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required rows={4} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Target Audience</label>
          <div className="flex gap-1.5">
            {(['all', 'class', 'class_type', 'level'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, target_type: t, target_id: '' })}
                className={`inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-medium transition-all ${
                  form.target_type === t
                    ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                {TARGET_ICON[t]} {t === 'all' ? 'Everyone' : t === 'class_type' ? 'Class Type' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>
        {form.target_type !== 'all' && targetOptions.length > 0 && (
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Select {form.target_type === 'class_type' ? 'Class Type' : form.target_type}</label>
            <select
              value={form.target_id}
              onChange={(e) => setForm({ ...form, target_id: e.target.value })}
              required
              className="h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="">Choose...</option>
              {targetOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.name}</option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="checkbox" id="publish" checked={form.publish} onChange={(e) => setForm({ ...form, publish: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
          <label htmlFor="publish" className="text-sm text-gray-600">Publish immediately</label>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="h-10 rounded-xl border border-gray-200 px-4 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button type="submit" disabled={loading} className="btn-gradient h-10 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {loading ? 'Creating...' : form.publish ? 'Create & Publish' : 'Save Draft'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
