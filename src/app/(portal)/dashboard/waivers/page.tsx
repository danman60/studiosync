'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, Shield, Check, PenTool, ChevronDown, ChevronUp } from 'lucide-react';

export default function ParentWaiversPage() {
  const signed = trpc.waiver.mySignatures.useQuery();
  const pending = trpc.waiver.myPendingWaivers.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Waivers</h1>
        <p className="mt-1 text-sm text-gray-500">View and sign studio waivers.</p>
      </div>

      {/* Pending Waivers */}
      {(pending.data?.length ?? 0) > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-amber-600 mb-3">Action Required</h2>
          <div className="space-y-3">
            {pending.data?.map((waiver) => (
              <PendingWaiverCard key={waiver.id} waiver={waiver} />
            ))}
          </div>
        </div>
      )}

      {/* Loading */}
      {signed.isLoading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="skeleton h-5 w-40 mb-2" />
              <div className="skeleton h-4 w-64" />
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!signed.isLoading && (signed.data?.length ?? 0) === 0 && (pending.data?.length ?? 0) === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <FileText size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No waivers</p>
          <p className="mt-1 text-xs text-gray-400">Studio waivers will appear here when available.</p>
        </div>
      )}

      {/* Signed Waivers */}
      {(signed.data?.length ?? 0) > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Signed Waivers</h2>
          <div className="space-y-3">
            {signed.data?.map((sig) => {
              const waiver = sig.waivers as { title: string; content: string; version: number } | null;
              return (
                <div key={sig.id} className="glass-card rounded-2xl p-5 flex items-center gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                    <Check size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-gray-900">{waiver?.title ?? 'Waiver'}</p>
                    <p className="text-xs text-gray-500">
                      Signed by {sig.parent_name} on {new Date(sig.signed_at).toLocaleDateString()}
                      <span className="ml-2 text-gray-400">v{sig.waiver_version}</span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pending Waiver Card ─────────────────────────────────

function PendingWaiverCard({ waiver }: { waiver: { id: string; title: string; content: string; version: number } }) {
  const utils = trpc.useUtils();
  const [expanded, setExpanded] = useState(false);
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false);

  const sign = trpc.waiver.sign.useMutation({
    onSuccess: () => {
      utils.waiver.mySignatures.invalidate();
      utils.waiver.myPendingWaivers.invalidate();
    },
  });

  return (
    <div className="glass-card rounded-2xl border-2 border-amber-200 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <Shield size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{waiver.title}</p>
            <p className="text-xs text-amber-600 font-medium">Signature required</p>
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          <div className="max-h-64 overflow-y-auto rounded-lg bg-gray-50 p-4 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {waiver.content}
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="text-sm text-gray-700">I have read and agree to the terms of this waiver.</span>
          </label>

          {accepted && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type your full name as electronic signature
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 italic"
                placeholder="Your full name"
              />
            </div>
          )}

          {sign.isError && (
            <p className="text-sm text-red-600">{sign.error.message}</p>
          )}

          <button
            onClick={() => sign.mutate({ waiverId: waiver.id, parentName: name.trim() })}
            disabled={!accepted || !name.trim() || sign.isPending}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            <PenTool size={14} />
            {sign.isPending ? 'Signing...' : 'Sign Waiver'}
          </button>
        </div>
      )}
    </div>
  );
}
