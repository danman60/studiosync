'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Tag,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Eye,
  Percent,
  DollarSign,
  Users,
  BarChart3,
} from 'lucide-react';

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function PromoCodesPage() {
  const utils = trpc.useUtils();
  const codes = trpc.promo.list.useQuery();
  const stats = trpc.promo.stats.useQuery();
  const [showCreate, setShowCreate] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const deleteMut = trpc.promo.delete.useMutation({
    onSuccess: () => {
      utils.promo.list.invalidate();
      utils.promo.stats.invalidate();
    },
  });

  const toggleMut = trpc.promo.update.useMutation({
    onSuccess: () => {
      utils.promo.list.invalidate();
      utils.promo.stats.invalidate();
    },
  });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Promo Codes</h1>
          <p className="mt-1 text-sm text-stone-500">Create discount codes for registration, invoices, and tuition.</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
        >
          <Plus size={16} /> New Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-6">
        {[
          { label: 'Total Codes', value: stats.data?.totalCodes ?? '—', icon: Tag, cardBg: '', iconBg: 'bg-primary-50 text-primary' },
          { label: 'Active', value: stats.data?.activeCodes ?? '—', icon: ToggleRight, cardBg: '', iconBg: 'bg-emerald-100 text-emerald-600' },
          { label: 'Times Used', value: stats.data?.totalApplications ?? '—', icon: Users, cardBg: '', iconBg: 'bg-blue-100 text-blue-600' },
          { label: 'Total Saved', value: stats.data ? formatCents(stats.data.totalSaved) : '—', icon: BarChart3, cardBg: '', iconBg: 'bg-primary-50 text-primary' },
        ].map((s, i) => (
          <div key={s.label} className={`glass-card rounded-2xl p-6 animate-fade-in-up stagger-${i + 1}`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${s.iconBg}`}>
                <s.icon size={20} />
              </div>
              <div>
                <p className="stat-number">{s.value}</p>
                <p className="text-xs text-stone-500">{s.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Form */}
      {showCreate && (
        <CreatePromoForm
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            utils.promo.list.invalidate();
            utils.promo.stats.invalidate();
          }}
        />
      )}

      {/* Usage Details Modal */}
      {viewingId && (
        <UsageDetails promoCodeId={viewingId} onClose={() => setViewingId(null)} />
      )}

      {/* Codes Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Code', 'Discount', 'Applies To', 'Usage', 'Date Range', 'Status', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {codes.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {codes.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-14">
                    <Tag size={32} className="mx-auto text-stone-300" />
                    <p className="mt-3 text-sm text-stone-400">No promo codes yet</p>
                    <p className="text-xs text-stone-400">Create your first discount code above.</p>
                  </td>
                </tr>
              )}
              {codes.data?.map((code) => (
                <tr key={code.id} className="table-row-hover">
                  <td className="table-cell">
                    <span className="inline-block rounded-lg bg-primary-50 px-2.5 py-1 font-mono text-sm font-semibold text-primary-dark">
                      {code.code}
                    </span>
                    {code.description && <p className="mt-0.5 text-xs text-stone-400">{code.description}</p>}
                  </td>
                  <td className="table-cell">
                    <span className="font-medium text-stone-800">
                      {code.discount_type === 'percent'
                        ? `${code.discount_value / 100}%`
                        : formatCents(code.discount_value)}
                    </span>
                    <span className="ml-1 text-xs text-stone-400">
                      {code.discount_type === 'percent' ? 'off' : 'flat'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <span className="inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-600 capitalize">
                      {code.applies_to}
                    </span>
                  </td>
                  <td className="table-cell text-stone-600">
                    {code.current_uses}{code.max_uses ? ` / ${code.max_uses}` : ''}
                  </td>
                  <td className="table-cell text-xs text-stone-500">
                    {code.starts_at || code.expires_at ? (
                      <>
                        {code.starts_at ? new Date(code.starts_at).toLocaleDateString() : '—'}
                        {' → '}
                        {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : '—'}
                      </>
                    ) : (
                      <span className="text-stone-400">No limit</span>
                    )}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      code.is_active
                        ? 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25'
                        : 'bg-stone-500/15 text-stone-400 border border-stone-500/20'
                    }`}>
                      {code.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => setViewingId(code.id)}
                        title="View usage"
                        className="icon-btn text-primary hover:bg-primary-50"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => toggleMut.mutate({ id: code.id, is_active: !code.is_active })}
                        disabled={toggleMut.isPending}
                        title={code.is_active ? 'Deactivate' : 'Activate'}
                        className={`icon-btn ${code.is_active ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {code.is_active ? <ToggleLeft size={14} /> : <ToggleRight size={14} />}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete code "${code.code}"? This cannot be undone.`)) {
                            deleteMut.mutate({ id: code.id });
                          }
                        }}
                        disabled={deleteMut.isPending}
                        title="Delete"
                        className="icon-btn text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CreatePromoForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const createMut = trpc.promo.create.useMutation({ onSuccess: onCreated });

  const [form, setForm] = useState({
    code: '',
    description: '',
    discount_type: 'percent' as 'flat' | 'percent',
    discount_value: '',
    max_uses: '',
    min_purchase: '',
    starts_at: '',
    expires_at: '',
    applies_to: 'all' as 'all' | 'registration' | 'invoice' | 'tuition',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code || !form.discount_value) return;

    // For percent: store as basis points (5% = 500)
    // For flat: store as cents ($10 = 1000)
    const rawValue = parseFloat(form.discount_value);
    const discount_value = form.discount_type === 'percent'
      ? Math.round(rawValue * 100)
      : Math.round(rawValue * 100);

    createMut.mutate({
      code: form.code,
      description: form.description || undefined,
      discount_type: form.discount_type,
      discount_value,
      max_uses: form.max_uses ? parseInt(form.max_uses) : undefined,
      min_purchase: form.min_purchase ? Math.round(parseFloat(form.min_purchase) * 100) : undefined,
      starts_at: form.starts_at || undefined,
      expires_at: form.expires_at || undefined,
      applies_to: form.applies_to,
    });
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

  return (
    <div className="glass-card-static max-w-lg rounded-2xl p-6 mb-6 animate-fade-in-up">
      <h3 className="section-heading text-sm mb-4"><Tag size={14} /> Create Promo Code</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600">Code *</label>
            <input
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
              required
              placeholder="e.g. SPRING25"
              className={`${inputClass} font-mono`}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Applies To</label>
            <select
              value={form.applies_to}
              onChange={(e) => setForm((p) => ({ ...p, applies_to: e.target.value as typeof form.applies_to }))}
              className={inputClass}
            >
              <option value="all">All</option>
              <option value="registration">Registration Only</option>
              <option value="invoice">Invoices Only</option>
              <option value="tuition">Tuition Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-stone-600">Description</label>
          <input
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            placeholder="e.g. Spring 2026 early-bird discount"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600">Type</label>
            <select
              value={form.discount_type}
              onChange={(e) => setForm((p) => ({ ...p, discount_type: e.target.value as 'flat' | 'percent' }))}
              className={inputClass}
            >
              <option value="percent">Percentage (%)</option>
              <option value="flat">Flat Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Value *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 mt-0.5 text-sm text-stone-400">
                {form.discount_type === 'percent' ? <Percent size={14} /> : <DollarSign size={14} />}
              </span>
              <input
                type="number"
                step={form.discount_type === 'percent' ? '0.5' : '0.01'}
                min="0"
                value={form.discount_value}
                onChange={(e) => setForm((p) => ({ ...p, discount_value: e.target.value }))}
                required
                placeholder="0"
                className={`${inputClass} pl-8`}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Max Uses</label>
            <input
              type="number"
              min="1"
              value={form.max_uses}
              onChange={(e) => setForm((p) => ({ ...p, max_uses: e.target.value }))}
              placeholder="Unlimited"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-stone-600">Min Purchase ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.min_purchase}
              onChange={(e) => setForm((p) => ({ ...p, min_purchase: e.target.value }))}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Starts At</label>
            <input
              type="date"
              value={form.starts_at}
              onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-600">Expires At</label>
            <input
              type="date"
              value={form.expires_at}
              onChange={(e) => setForm((p) => ({ ...p, expires_at: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={createMut.isPending || !form.code || !form.discount_value}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            {createMut.isPending ? 'Creating...' : 'Create Code'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-stone-500 hover:text-stone-700"
          >
            Cancel
          </button>
        </div>
        {createMut.isError && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createMut.error.message}</p>
        )}
      </form>
    </div>
  );
}

function UsageDetails({ promoCodeId, onClose }: { promoCodeId: string; onClose: () => void }) {
  const apps = trpc.promo.applications.useQuery({ promoCodeId });

  return (
    <div className="glass-card-static rounded-2xl p-6 mb-6 animate-fade-in-up">
      <div className="flex items-center justify-between mb-4">
        <h3 className="section-heading text-sm"><Users size={14} /> Usage History</h3>
        <button onClick={onClose} className="text-xs text-stone-400 hover:text-stone-600">Close</button>
      </div>

      {apps.isLoading && <div className="skeleton h-20 w-full rounded-xl" />}

      {apps.data?.length === 0 && (
        <p className="text-sm text-stone-400 py-4 text-center">No usage yet</p>
      )}

      {apps.data && apps.data.length > 0 && (
        <div className="space-y-2">
          {apps.data.map((app) => {
            const fam = app.families as unknown as { parent_first_name: string; parent_last_name: string; email: string } | null;
            return (
              <div key={app.id} className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-2.5">
                <div>
                  <p className="text-sm font-medium text-stone-800">
                    {fam ? `${fam.parent_first_name} ${fam.parent_last_name}` : 'Unknown'}
                  </p>
                  <p className="text-xs text-stone-400">{fam?.email}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-emerald-600">-{formatCents(app.discount_amount)}</p>
                  <p className="text-xs text-stone-400">{new Date(app.applied_at).toLocaleDateString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
