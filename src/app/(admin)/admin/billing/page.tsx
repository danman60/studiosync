'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  Send,
  CheckCircle,
  XCircle,
  Eye,
  ChevronLeft,
  Download,
  RefreshCw,
  RotateCcw,
  Pause,
  Play,
  AlertCircle,
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-stone-500/15 text-stone-600 border border-stone-500/20',
  sent: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  paid: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  partial: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  overdue: 'bg-red-500/15 text-red-600 border border-red-500/25',
  void: 'bg-stone-500/15 text-stone-400 border border-stone-500/20',
  cancelled: 'bg-stone-500/15 text-stone-400 border border-stone-500/20',
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  past_due: 'bg-red-500/15 text-red-600 border border-red-500/25',
  paused: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BillingPage() {
  const [tab, setTab] = useState<'invoices' | 'tuition'>('invoices');
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Billing</h1>
          <p className="mt-1 text-sm text-stone-500">Invoices and recurring tuition plans.</p>
        </div>
        {tab === 'invoices' && view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
          >
            <Plus size={16} /> New Invoice
          </button>
        )}
      </div>

      {/* Tabs */}
      {view === 'list' && (
        <div className="mb-6 flex items-center gap-1 rounded-xl bg-stone-100 p-1 w-fit">
          <button
            onClick={() => setTab('invoices')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === 'invoices' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <FileText size={14} className="mr-1.5 inline" /> Invoices
          </button>
          <button
            onClick={() => setTab('tuition')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              tab === 'tuition' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <RefreshCw size={14} className="mr-1.5 inline" /> Auto-Pay Plans
          </button>
        </div>
      )}

      {tab === 'invoices' && (
        <>
          {view === 'list' && (
            <InvoiceList
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onView={(id) => { setSelectedId(id); setView('detail'); }}
            />
          )}
          {view === 'create' && (
            <CreateInvoice onBack={() => setView('list')} onCreated={(id) => { setSelectedId(id); setView('detail'); }} />
          )}
          {view === 'detail' && selectedId && (
            <InvoiceDetail id={selectedId} onBack={() => { setSelectedId(null); setView('list'); }} />
          )}
        </>
      )}

      {tab === 'tuition' && view === 'list' && <TuitionPlansSection />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// TUITION PLANS SECTION
// ══════════════════════════════════════════════════════════

function TuitionPlansSection() {
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();
  const stats = trpc.tuition.stats.useQuery();
  const plans = trpc.tuition.list.useQuery();
  const families = trpc.admin.listFamilies.useQuery();

  const [form, setForm] = useState({ family_id: '', name: '', description: '', amount: '', interval: 'month' as 'month' | 'year' });

  const createPlan = trpc.tuition.create.useMutation({
    onSuccess: () => {
      utils.tuition.list.invalidate();
      utils.tuition.stats.invalidate();
      setShowCreate(false);
      setForm({ family_id: '', name: '', description: '', amount: '', interval: 'month' });
    },
  });

  const cancelPlan = trpc.tuition.cancel.useMutation({
    onSuccess: () => {
      utils.tuition.list.invalidate();
      utils.tuition.stats.invalidate();
    },
  });

  const pausePlan = trpc.tuition.pause.useMutation({
    onSuccess: () => {
      utils.tuition.list.invalidate();
      utils.tuition.stats.invalidate();
    },
  });

  const resumePlan = trpc.tuition.resume.useMutation({
    onSuccess: () => {
      utils.tuition.list.invalidate();
      utils.tuition.stats.invalidate();
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.family_id || !form.name || !form.amount) return;
    createPlan.mutate({
      family_id: form.family_id,
      name: form.name,
      description: form.description || undefined,
      amount: Math.round(parseFloat(form.amount) * 100),
      interval: form.interval,
    });
  };

  const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="glass-card rounded-2xl bg-primary-50 p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary">
              <RefreshCw size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data?.activeCount ?? '—'}</p>
              <p className="text-xs text-stone-500">Active Plans</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data ? formatCents(stats.data.monthlyRecurring) : '—'}</p>
              <p className="text-xs text-stone-500">Monthly Recurring</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data?.pastDueCount ?? '—'}</p>
              <p className="text-xs text-stone-500">Past Due</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Plan Button / Form */}
      {!showCreate ? (
        <div className="mb-4">
          <button
            onClick={() => setShowCreate(true)}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium"
          >
            <Plus size={16} /> New Tuition Plan
          </button>
        </div>
      ) : (
        <div className="glass-card-static max-w-lg rounded-2xl p-6 mb-6 animate-fade-in-up">
          <h3 className="section-heading text-sm mb-4"><RefreshCw size={14} /> Create Auto-Pay Plan</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-700">Family *</label>
              <select
                value={form.family_id}
                onChange={(e) => setForm((p) => ({ ...p, family_id: e.target.value }))}
                required
                className={inputClass}
              >
                <option value="">Select a family...</option>
                {(families.data ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.parent_first_name} {f.parent_last_name} ({f.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Plan Name *</label>
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                placeholder="e.g. Monthly Ballet Tuition"
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700">Description</label>
              <input
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Optional details"
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-stone-700">Amount ($) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                  required
                  placeholder="0.00"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700">Billing Interval</label>
                <select
                  value={form.interval}
                  onChange={(e) => setForm((p) => ({ ...p, interval: e.target.value as 'month' | 'year' }))}
                  className={inputClass}
                >
                  <option value="month">Monthly</option>
                  <option value="year">Yearly</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={createPlan.isPending || !form.family_id || !form.name || !form.amount}
                className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
              >
                {createPlan.isPending ? 'Creating...' : 'Create Plan'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="inline-flex h-11 items-center rounded-xl px-4 text-sm font-medium text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>
            {createPlan.isError && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{createPlan.error.message}</p>
            )}
          </form>
        </div>
      )}

      {/* Plans Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Plan', 'Family', 'Amount', 'Interval', 'Status', 'Next Charge', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {plans.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {plans.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-14">
                    <RefreshCw size={32} className="mx-auto text-stone-300" />
                    <p className="mt-3 text-sm text-stone-400">No tuition plans yet</p>
                    <p className="text-xs text-stone-400">Create a plan to start auto-billing families.</p>
                  </td>
                </tr>
              )}
              {plans.data?.map((plan) => {
                const fam = plan.families as unknown as { parent_first_name: string; parent_last_name: string; email: string } | null;
                return (
                  <tr key={plan.id} className="table-row-hover">
                    <td className="table-cell">
                      <p className="font-medium text-stone-800">{plan.name}</p>
                      {plan.description && <p className="text-xs text-stone-400">{plan.description}</p>}
                    </td>
                    <td className="table-cell text-stone-600">
                      {fam ? `${fam.parent_first_name} ${fam.parent_last_name}` : '—'}
                    </td>
                    <td className="table-cell font-medium text-stone-800">{formatCents(plan.amount)}</td>
                    <td className="table-cell text-stone-600 capitalize">{plan.interval}ly</td>
                    <td className="table-cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[plan.status] ?? ''}`}>
                        {plan.status.replace('_', ' ')}
                      </span>
                      {plan.cancel_at_period_end && (
                        <span className="ml-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600 border border-amber-200">
                          cancelling
                        </span>
                      )}
                    </td>
                    <td className="table-cell text-stone-600 text-xs">
                      {plan.current_period_end
                        ? new Date(plan.current_period_end).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center gap-1 justify-end">
                        {plan.status === 'active' && (
                          <button
                            onClick={() => pausePlan.mutate({ id: plan.id })}
                            disabled={pausePlan.isPending}
                            title="Pause"
                            className="icon-btn text-amber-600 hover:bg-amber-50"
                          >
                            <Pause size={14} />
                          </button>
                        )}
                        {plan.status === 'paused' && (
                          <button
                            onClick={() => resumePlan.mutate({ id: plan.id })}
                            disabled={resumePlan.isPending}
                            title="Resume"
                            className="icon-btn text-emerald-600 hover:bg-emerald-50"
                          >
                            <Play size={14} />
                          </button>
                        )}
                        {plan.status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              if (confirm('Cancel this tuition plan? The family will no longer be auto-billed.')) {
                                cancelPlan.mutate({ id: plan.id, immediately: true });
                              }
                            }}
                            disabled={cancelPlan.isPending}
                            title="Cancel Plan"
                            className="icon-btn text-red-500 hover:bg-red-50"
                          >
                            <XCircle size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(cancelPlan.isError || pausePlan.isError || resumePlan.isError) && (
        <p className="mt-3 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">
          {cancelPlan.error?.message ?? pausePlan.error?.message ?? resumePlan.error?.message}
        </p>
      )}
    </>
  );
}

// ══════════════════════════════════════════════════════════
// INVOICE LIST
// ══════════════════════════════════════════════════════════

function InvoiceList({
  statusFilter,
  onStatusFilter,
  onView,
}: {
  statusFilter: string;
  onStatusFilter: (s: string) => void;
  onView: (id: string) => void;
}) {
  const stats = trpc.invoice.stats.useQuery();
  const utils = trpc.useUtils();
  const invoices = trpc.invoice.list.useQuery(
    statusFilter ? { status: statusFilter as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled' } : undefined
  );

  const processOverdue = trpc.invoice.processOverdue.useMutation({
    onSuccess: (data) => {
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
      alert(`Done: ${data.markedOverdue} marked overdue, ${data.feesApplied} late fees applied.`);
    },
  });

  function exportCSV() {
    const rows = invoices.data ?? [];
    if (rows.length === 0) return;
    const header = ['Invoice #', 'Family', 'Email', 'Status', 'Due Date', 'Total', 'Paid'];
    const csvRows = rows.map((inv) => {
      const fam = inv.families as unknown as { parent_first_name: string; parent_last_name: string; email: string } | null;
      return [
        inv.invoice_number,
        fam ? `${fam.parent_first_name} ${fam.parent_last_name}` : '',
        fam?.email ?? '',
        inv.status,
        inv.due_date,
        (inv.total / 100).toFixed(2),
        (inv.amount_paid / 100).toFixed(2),
      ].map((v) => `"${v}"`).join(',');
    });
    const csv = [header.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoices-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      {/* Actions */}
      <div className="mb-4 flex items-center justify-end gap-2">
        <button
          onClick={() => {
            if (confirm('Process overdue invoices and apply late fees now?')) {
              processOverdue.mutate();
            }
          }}
          disabled={processOverdue.isPending}
          className="btn-outline inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-medium disabled:opacity-50"
        >
          <AlertCircle size={14} /> {processOverdue.isPending ? 'Processing...' : 'Process Overdue'}
        </button>
        <button
          onClick={exportCSV}
          disabled={!invoices.data?.length}
          className="btn-outline inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-medium disabled:opacity-50"
        >
          <Download size={14} /> Export CSV
        </button>
      </div>
      {processOverdue.isError && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{processOverdue.error.message}</p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="glass-card rounded-2xl bg-primary-50 p-6 animate-fade-in-up stagger-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-100 text-primary">
              <FileText size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data?.totalInvoices ?? '—'}</p>
              <p className="text-xs text-stone-500">Total Invoices</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6 animate-fade-in-up stagger-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data ? formatCents(stats.data.outstanding) : '—'}</p>
              <p className="text-xs text-stone-500">Outstanding</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6 animate-fade-in-up stagger-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="stat-number">{stats.data ? formatCents(stats.data.collected) : '—'}</p>
              <p className="text-xs text-stone-500">Collected</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex items-center gap-2">
        {['', 'draft', 'sent', 'paid', 'overdue'].map((s) => (
          <button
            key={s}
            onClick={() => onStatusFilter(s)}
            className={`filter-chip ${statusFilter === s ? 'filter-chip-active' : ''}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Invoice #', 'Family', 'Status', 'Due Date', 'Total', 'Paid', ''].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {invoices.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {invoices.data?.length === 0 && (
                <tr>
                  <td colSpan={7} className="table-cell text-center py-14">
                    <FileText size={32} className="mx-auto text-stone-300" />
                    <p className="mt-3 text-sm text-stone-400">No invoices yet</p>
                  </td>
                </tr>
              )}
              {invoices.data?.map((inv) => {
                const fam = inv.families as unknown as { parent_first_name: string; parent_last_name: string } | null;
                return (
                  <tr key={inv.id} className="table-row-hover">
                    <td className="table-cell font-medium text-primary">{inv.invoice_number}</td>
                    <td className="table-cell text-stone-600">
                      {fam ? `${fam.parent_first_name} ${fam.parent_last_name}` : '—'}
                    </td>
                    <td className="table-cell">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="table-cell text-stone-600">{inv.due_date}</td>
                    <td className="table-cell font-medium text-stone-800">{formatCents(inv.total)}</td>
                    <td className="table-cell text-stone-600">{formatCents(inv.amount_paid)}</td>
                    <td className="table-cell text-right">
                      <button
                        onClick={() => onView(inv.id)}
                        className="inline-flex h-9 items-center gap-1 rounded-lg px-3 text-xs font-medium text-primary transition-colors hover:bg-primary-50"
                      >
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════
// CREATE INVOICE
// ══════════════════════════════════════════════════════════

function CreateInvoice({
  onBack,
  onCreated,
}: {
  onBack: () => void;
  onCreated: (id: string) => void;
}) {
  const families = trpc.admin.listFamilies.useQuery();
  const utils = trpc.useUtils();

  const [familyId, setFamilyId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [taxRate, setTaxRate] = useState('0');
  const [notes, setNotes] = useState('');

  const inputClass = 'mt-1 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm text-stone-800 transition-shadow input-glow';

  const create = trpc.invoice.create.useMutation({
    onSuccess: (data) => {
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
      onCreated(data.id);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!familyId || !dueDate) return;
    create.mutate({
      family_id: familyId,
      due_date: dueDate,
      tax_rate: parseFloat(taxRate) / 100,
      notes: notes || undefined,
    });
  };

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700">
        <ChevronLeft size={16} /> Back to Invoices
      </button>

      <div className="glass-card-static max-w-lg rounded-2xl p-6">
        <h2 className="section-heading text-base mb-4"><FileText size={16} /> Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700">Family *</label>
            <select
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              required
              className={inputClass}
            >
              <option value="">Select a family...</option>
              {(families.data ?? []).map((f) => (
                <option key={f.id} value={f.id}>
                  {f.parent_first_name} {f.parent_last_name} ({f.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={inputClass}
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending || !familyId || !dueDate}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
          {create.isError && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{create.error.message}</p>}
        </form>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// INVOICE DETAIL
// ══════════════════════════════════════════════════════════

function InvoiceDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const utils = trpc.useUtils();
  const invoice = trpc.invoice.get.useQuery({ id });
  const [newItem, setNewItem] = useState({ description: '', quantity: '1', unit_price: '' });

  const addItem = trpc.invoice.addLineItem.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.stats.invalidate();
      setNewItem({ description: '', quantity: '1', unit_price: '' });
    },
  });
  const removeItem = trpc.invoice.removeLineItem.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.stats.invalidate();
    },
  });
  const sendInv = trpc.invoice.send.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
    },
  });
  const markPaid = trpc.invoice.markPaid.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
    },
  });
  const voidInv = trpc.invoice.void.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
    },
  });
  const refundInv = trpc.invoice.refund.useMutation({
    onSuccess: () => {
      utils.invoice.get.invalidate({ id });
      utils.invoice.list.invalidate();
      utils.invoice.stats.invalidate();
    },
  });
  const [showRefundInput, setShowRefundInput] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');

  const inv = invoice.data;
  const fam = inv?.families as unknown as { parent_first_name: string; parent_last_name: string; email: string } | null;
  const items = (inv?.invoice_line_items ?? []) as unknown as Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;
  const canEdit = inv?.status === 'draft' || inv?.status === 'sent';

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.description || !newItem.unit_price) return;
    addItem.mutate({
      invoice_id: id,
      description: newItem.description,
      quantity: parseInt(newItem.quantity) || 1,
      unit_price: Math.round(parseFloat(newItem.unit_price) * 100),
    });
  };

  if (invoice.isLoading) {
    return (
      <div>
        <div className="skeleton h-8 w-48 mb-4" />
        <div className="skeleton h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!inv) {
    return <p className="text-red-600">Invoice not found</p>;
  }

  return (
    <div>
      <button onClick={onBack} className="mb-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700">
        <ChevronLeft size={16} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-stone-800">{inv.invoice_number}</h2>
            <p className="text-sm text-stone-500">
              {fam ? `${fam.parent_first_name} ${fam.parent_last_name} (${fam.email})` : '—'}
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm text-stone-600">
              <span>Issued: {inv.issue_date}</span>
              <span>Due: {inv.due_date}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
              {inv.status}
            </span>
            <p className="mt-2 stat-number">{formatCents(inv.total)}</p>
            {inv.amount_paid > 0 && (
              <p className="text-sm text-emerald-600">Paid: {formatCents(inv.amount_paid)}</p>
            )}
            {inv.late_fee_amount > 0 && (
              <p className="text-xs text-amber-600">Late fee: {formatCents(inv.late_fee_amount)}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {inv.status === 'draft' && (
            <button
              onClick={() => sendInv.mutate({ id })}
              disabled={sendInv.isPending || inv.total === 0}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={14} /> {sendInv.isPending ? 'Sending...' : 'Send Invoice'}
            </button>
          )}
          {['sent', 'partial', 'overdue'].includes(inv.status) && (
            <button
              onClick={() => markPaid.mutate({ id })}
              disabled={markPaid.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle size={14} /> {markPaid.isPending ? 'Marking...' : 'Mark Paid'}
            </button>
          )}
          {inv.status !== 'paid' && inv.status !== 'void' && (
            <button
              onClick={() => voidInv.mutate({ id })}
              disabled={voidInv.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-stone-200 px-4 text-xs font-medium text-stone-700 hover:bg-stone-300 disabled:opacity-50"
            >
              <XCircle size={14} /> {voidInv.isPending ? 'Voiding...' : 'Void'}
            </button>
          )}
          {(inv.status === 'paid' || inv.status === 'partial') && inv.amount_paid > 0 && (
            <button
              onClick={() => {
                if (showRefundInput) {
                  const cents = refundAmount ? Math.round(parseFloat(refundAmount) * 100) : undefined;
                  if (confirm(`Refund ${cents ? formatCents(cents) : 'full amount'}?`)) {
                    refundInv.mutate({ id, amount: cents });
                    setShowRefundInput(false);
                    setRefundAmount('');
                  }
                } else {
                  setShowRefundInput(true);
                }
              }}
              disabled={refundInv.isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-amber-100 px-4 text-xs font-medium text-amber-700 hover:bg-amber-200 disabled:opacity-50"
            >
              <RotateCcw size={14} /> {refundInv.isPending ? 'Processing...' : showRefundInput ? 'Confirm Refund' : 'Refund'}
            </button>
          )}
        </div>
        {showRefundInput && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={(inv.amount_paid / 100).toFixed(2)}
              placeholder={`Full refund: ${formatCents(inv.amount_paid)}`}
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              className="h-9 w-48 rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow"
            />
            <span className="text-xs text-stone-400">Leave empty for full refund</span>
            <button onClick={() => { setShowRefundInput(false); setRefundAmount(''); }} className="text-xs text-stone-500 hover:text-stone-700">Cancel</button>
          </div>
        )}
        {(sendInv.isError || markPaid.isError || voidInv.isError || refundInv.isError) && (
          <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {sendInv.error?.message ?? markPaid.error?.message ?? voidInv.error?.message ?? refundInv.error?.message}
          </p>
        )}
      </div>

      {/* Line Items */}
      <div className="glass-card-static overflow-hidden rounded-2xl mb-6">
        <table className="min-w-full divide-y divide-stone-100">
          <thead>
            <tr className="bg-stone-50/60">
              {['Description', 'Qty', 'Unit Price', 'Total', ''].map((h) => (
                <th key={h} className="table-header">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-50">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="table-cell text-center py-8 text-stone-400">No line items yet</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id} className="table-row-hover">
                <td className="table-cell text-stone-800">{item.description}</td>
                <td className="table-cell text-stone-600">{item.quantity}</td>
                <td className="table-cell text-stone-600">{formatCents(item.unit_price)}</td>
                <td className="table-cell font-medium text-stone-800">{formatCents(item.total)}</td>
                <td className="table-cell">
                  {canEdit && (
                    <button
                      onClick={() => removeItem.mutate({ id: item.id })}
                      className="text-xs font-medium text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="bg-stone-50/40">
              <td colSpan={3} className="table-cell text-right text-xs font-medium text-stone-500">Subtotal</td>
              <td className="table-cell font-medium text-stone-800">{formatCents(inv.subtotal)}</td>
              <td />
            </tr>
            {inv.tax_rate > 0 && (
              <tr className="bg-stone-50/40">
                <td colSpan={3} className="table-cell text-right text-xs font-medium text-stone-500">Tax ({(inv.tax_rate * 100).toFixed(2)}%)</td>
                <td className="table-cell font-medium text-stone-800">{formatCents(inv.tax_amount)}</td>
                <td />
              </tr>
            )}
            <tr className="bg-stone-50/60">
              <td colSpan={3} className="table-cell text-right text-sm font-semibold text-stone-800">Total</td>
              <td className="table-cell font-bold text-stone-800">{formatCents(inv.total)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Line Item */}
      {canEdit && (
        <div className="glass-card-static rounded-2xl p-5">
          <h3 className="section-heading text-sm mb-3"><Plus size={14} /> Add Line Item</h3>
          <form onSubmit={handleAddItem} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-stone-500 mb-1">Description</label>
              <input
                value={newItem.description}
                onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                required
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-shadow input-glow"
                placeholder="e.g. Monthly tuition - Ballet"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-stone-500 mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-shadow input-glow"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-stone-500 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItem.unit_price}
                onChange={(e) => setNewItem((p) => ({ ...p, unit_price: e.target.value }))}
                required
                placeholder="0.00"
                className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm transition-shadow input-glow"
              />
            </div>
            <button
              type="submit"
              disabled={addItem.isPending}
              className="inline-flex h-10 items-center gap-1 rounded-xl bg-primary px-4 text-xs font-medium text-white hover:bg-primary-dark disabled:opacity-50"
            >
              <Plus size={14} /> {addItem.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>
          {addItem.isError && <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{addItem.error.message}</p>}
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="mt-4 glass-card-static rounded-2xl p-5">
          <h3 className="section-heading text-sm mb-2"><FileText size={14} /> Notes</h3>
          <p className="text-sm text-stone-600 whitespace-pre-wrap">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}
