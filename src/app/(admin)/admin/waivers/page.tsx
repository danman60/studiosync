'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, Plus, Edit3, Trash2, Eye, ChevronLeft, ToggleLeft, ToggleRight, Shield, PenTool } from 'lucide-react';

type Tab = 'templates' | 'signatures';

export default function AdminWaiversPage() {
  const [tab, setTab] = useState<Tab>('templates');
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewSignaturesForWaiver, setViewSignaturesForWaiver] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Waivers & E-Signatures</h1>
          <p className="mt-1 text-sm text-stone-500">Create liability waivers and track parent signatures.</p>
        </div>
        {tab === 'templates' && (
          <button
            onClick={() => { setShowCreate(true); setEditId(null); }}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
          >
            <Plus size={16} /> New Waiver
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-stone-100 p-1 w-fit">
        {(['templates', 'signatures'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === t
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            {t === 'templates' ? 'Waiver Templates' : 'Signatures'}
          </button>
        ))}
      </div>

      {tab === 'templates' && !showCreate && !editId && !viewSignaturesForWaiver && (
        <WaiverTemplatesList
          onEdit={setEditId}
          onCreate={() => setShowCreate(true)}
          onViewSignatures={setViewSignaturesForWaiver}
        />
      )}

      {tab === 'templates' && (showCreate || editId) && (
        <WaiverForm
          editId={editId}
          onClose={() => { setShowCreate(false); setEditId(null); }}
        />
      )}

      {tab === 'templates' && viewSignaturesForWaiver && (
        <WaiverSignaturesList
          waiverId={viewSignaturesForWaiver}
          onBack={() => setViewSignaturesForWaiver(null)}
        />
      )}

      {tab === 'signatures' && <AllSignatures />}
    </div>
  );
}

// ── Waiver Templates List ─────────────────────────────────

function WaiverTemplatesList({
  onEdit,
  onCreate,
  onViewSignatures,
}: {
  onEdit: (id: string) => void;
  onCreate: () => void;
  onViewSignatures: (id: string) => void;
}) {
  const waivers = trpc.waiver.list.useQuery();
  const stats = trpc.waiver.stats.useQuery();
  const utils = trpc.useUtils();
  const toggleActive = trpc.waiver.update.useMutation({
    onSuccess: () => {
      utils.waiver.list.invalidate();
      utils.waiver.stats.invalidate();
    },
  });
  const deleteWaiver = trpc.waiver.delete.useMutation({
    onSuccess: () => {
      utils.waiver.list.invalidate();
      utils.waiver.stats.invalidate();
    },
  });

  if (waivers.isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Stats */}
      {stats.data && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-card rounded-2xl p-5 bg-primary-50">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Total Waivers</p>
            <p className="mt-1 stat-number">{stats.data.totalWaivers}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Active</p>
            <p className="mt-1 stat-number">{stats.data.activeWaivers}</p>
          </div>
          <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-amber-500/5 to-orange-500/5">
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">Signatures</p>
            <p className="mt-1 stat-number">{stats.data.totalSignatures}</p>
          </div>
        </div>
      )}

      {(waivers.data?.length ?? 0) === 0 ? (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <FileText size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No waivers yet</p>
          <p className="mt-1 text-xs text-stone-400">Create a waiver template to get started.</p>
          <button onClick={onCreate} className="btn-gradient mt-4 inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-medium">
            <Plus size={14} /> Create Waiver
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {waivers.data?.map((w) => {
            const seasons = w.seasons as { name: string } | null;
            return (
              <div key={w.id} className="glass-card rounded-2xl p-5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${w.is_active ? 'bg-primary-100 text-primary' : 'bg-stone-100 text-stone-400'}`}>
                    <Shield size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-stone-800 truncate">{w.title}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 font-medium ${
                        w.is_active
                          ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                          : 'bg-stone-500/15 text-stone-500 border border-stone-500/25'
                      }`}>
                        {w.is_active ? 'Active' : 'Inactive'}
                      </span>
                      {w.is_required && (
                        <span className="inline-block rounded-full px-2.5 py-0.5 font-medium bg-red-500/15 text-red-600 border border-red-500/25">
                          Required
                        </span>
                      )}
                      <span className="text-stone-400">v{w.version}</span>
                      {seasons && <span className="text-stone-400">{seasons.name}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onViewSignatures(w.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-primary-50 hover:text-primary transition-colors"
                    title="View signatures"
                  >
                    <Eye size={16} />
                  </button>
                  <button
                    onClick={() => toggleActive.mutate({ id: w.id, is_active: !w.is_active })}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-primary-50 hover:text-primary transition-colors"
                    title={w.is_active ? 'Deactivate' : 'Activate'}
                  >
                    {w.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                  <button
                    onClick={() => onEdit(w.id)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-primary-50 hover:text-primary transition-colors"
                    title="Edit"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete "${w.title}"? This cannot be undone.`)) {
                        deleteWaiver.mutate({ id: w.id });
                      }
                    }}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Waiver Form (Create / Edit) ───────────────────────────

function WaiverForm({ editId, onClose }: { editId: string | null; onClose: () => void }) {
  const utils = trpc.useUtils();
  const seasons = trpc.admin.getSeasons.useQuery();
  const existing = trpc.waiver.list.useQuery();
  const editData = editId ? existing.data?.find((w) => w.id === editId) : null;

  const [title, setTitle] = useState(editData?.title ?? '');
  const [content, setContent] = useState(editData?.content ?? '');
  const [seasonId, setSeasonId] = useState<string>(editData?.season_id ?? '');
  const [isRequired, setIsRequired] = useState(editData?.is_required ?? true);

  const create = trpc.waiver.create.useMutation({
    onSuccess: () => {
      utils.waiver.list.invalidate();
      utils.waiver.stats.invalidate();
      onClose();
    },
  });
  const update = trpc.waiver.update.useMutation({
    onSuccess: () => {
      utils.waiver.list.invalidate();
      utils.waiver.stats.invalidate();
      onClose();
    },
  });

  const isPending = create.isPending || update.isPending;

  function handleSave() {
    if (editId) {
      update.mutate({
        id: editId,
        title,
        content,
        season_id: seasonId || null,
        is_required: isRequired,
      });
    } else {
      create.mutate({
        title,
        content,
        season_id: seasonId || null,
        is_required: isRequired,
      });
    }
  }

  return (
    <div>
      <button onClick={onClose} className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary transition-colors">
        <ChevronLeft size={16} /> Back to Waivers
      </button>

      <div className="glass-card-static rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-stone-800 mb-5">
          {editId ? 'Edit Waiver' : 'New Waiver Template'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
              placeholder="e.g. Liability Waiver 2025-2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Season (optional)</label>
            <select
              value={seasonId}
              onChange={(e) => setSeasonId(e.target.value)}
              className="form-input w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="">All Seasons (studio-wide)</option>
              {(seasons.data ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">
              Waiver Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={12}
              className="form-input w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-800 focus:border-primary focus:ring-2 focus:ring-primary/20 leading-relaxed"
              placeholder="Enter the full text of your waiver/liability form..."
            />
            <p className="mt-1 text-xs text-stone-400">Plain text. Supports basic formatting with paragraphs.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRequired}
                onChange={(e) => setIsRequired(e.target.checked)}
                className="h-4 w-4 rounded border-stone-300 text-primary focus:ring-primary"
              />
              <span className="text-sm text-stone-700">Required for registration</span>
            </label>
          </div>

          {(create.isError || update.isError) && (
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-3 text-sm text-red-700">
              {create.error?.message ?? update.error?.message}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={isPending || !title.trim() || !content.trim()}
              className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
            >
              {isPending ? 'Saving...' : editId ? 'Update Waiver' : 'Create Waiver'}
            </button>
            <button
              onClick={onClose}
              className="inline-flex h-11 items-center rounded-xl border border-stone-200 bg-white px-5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Waiver Signatures List ────────────────────────────────

function WaiverSignaturesList({ waiverId, onBack }: { waiverId: string; onBack: () => void }) {
  const sigs = trpc.waiver.signatures.useQuery({ waiverId });

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-primary transition-colors">
        <ChevronLeft size={16} /> Back to Waivers
      </button>

      <div className="glass-card-static overflow-hidden rounded-2xl">
        <table className="min-w-full divide-y divide-stone-100">
          <thead>
            <tr className="bg-stone-50/60">
              <th className="table-header">Signed By</th>
              <th className="table-header">Email</th>
              <th className="table-header">Student</th>
              <th className="table-header text-center">Version</th>
              <th className="table-header text-right">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {sigs.isLoading && (
              <tr><td colSpan={5} className="px-5 py-4"><div className="skeleton h-4 w-full" /></td></tr>
            )}
            {!sigs.isLoading && (sigs.data?.length ?? 0) === 0 && (
              <tr><td colSpan={5} className="px-5 py-8 text-center text-sm text-stone-400">No signatures yet</td></tr>
            )}
            {sigs.data?.map((sig) => {
              const student = sig.students as { first_name: string; last_name: string } | null;
              return (
                <tr key={sig.id} className="table-row-hover">
                  <td className="table-cell font-medium text-stone-800">{sig.parent_name}</td>
                  <td className="table-cell text-stone-600">{sig.parent_email}</td>
                  <td className="table-cell text-stone-600">
                    {student ? `${student.first_name} ${student.last_name}` : '—'}
                  </td>
                  <td className="table-cell text-center text-stone-600">v{sig.waiver_version}</td>
                  <td className="table-cell text-right text-stone-600">
                    {new Date(sig.signed_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── All Signatures Tab ────────────────────────────────────

function AllSignatures() {
  const sigs = trpc.waiver.signatures.useQuery({});

  if (sigs.isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-6">
            <div className="skeleton h-5 w-40 mb-2" />
            <div className="skeleton h-4 w-64" />
          </div>
        ))}
      </div>
    );
  }

  if ((sigs.data?.length ?? 0) === 0) {
    return (
      <div className="empty-state">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
          <PenTool size={24} className="text-primary-light" />
        </div>
        <p className="text-sm font-medium text-stone-600">No signatures yet</p>
        <p className="mt-1 text-xs text-stone-400">Signatures will appear here as parents sign waivers.</p>
      </div>
    );
  }

  return (
    <div className="glass-card-static overflow-hidden rounded-2xl">
      <table className="min-w-full divide-y divide-stone-100">
        <thead>
          <tr className="bg-stone-50/60">
            <th className="table-header">Waiver</th>
            <th className="table-header">Signed By</th>
            <th className="table-header">Family</th>
            <th className="table-header text-center">Version</th>
            <th className="table-header text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-50">
          {sigs.data?.map((sig) => {
            const waiver = sig.waivers as { title: string; version: number } | null;
            const family = sig.families as { parent_first_name: string; parent_last_name: string } | null;
            return (
              <tr key={sig.id} className="table-row-hover">
                <td className="table-cell font-medium text-stone-800">{waiver?.title ?? '—'}</td>
                <td className="table-cell text-stone-600">{sig.parent_name}</td>
                <td className="table-cell text-stone-600">
                  {family ? `${family.parent_first_name} ${family.parent_last_name}` : sig.parent_email}
                </td>
                <td className="table-cell text-center text-stone-600">v{sig.waiver_version}</td>
                <td className="table-cell text-right text-stone-600">
                  {new Date(sig.signed_at).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
