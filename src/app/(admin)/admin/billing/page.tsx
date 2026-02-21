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
} from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-500/15 text-gray-600 border border-gray-500/20',
  sent: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  paid: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  partial: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  overdue: 'bg-red-500/15 text-red-600 border border-red-500/25',
  void: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
  cancelled: 'bg-gray-500/15 text-gray-400 border border-gray-500/20',
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function BillingPage() {
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('');

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Invoices</h1>
          <p className="mt-1 text-sm text-gray-500">Create and manage invoices for families.</p>
        </div>
        {view === 'list' && (
          <button
            onClick={() => setView('create')}
            className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium"
          >
            <Plus size={16} /> New Invoice
          </button>
        )}
      </div>

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
    </div>
  );
}

// ── Invoice List ─────────────────────────────────────────

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
  const invoices = trpc.invoice.list.useQuery(
    statusFilter ? { status: statusFilter as 'draft' | 'sent' | 'paid' | 'partial' | 'overdue' | 'void' | 'cancelled' } : undefined
  );

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-6">
        <div className="glass-card rounded-2xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
              <FileText size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.data?.totalInvoices ?? '—'}</p>
              <p className="text-xs text-gray-500">Total Invoices</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.data ? formatCents(stats.data.outstanding) : '—'}</p>
              <p className="text-xs text-gray-500">Outstanding</p>
            </div>
          </div>
        </div>
        <div className="glass-card rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.data ? formatCents(stats.data.collected) : '—'}</p>
              <p className="text-xs text-gray-500">Collected</p>
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
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card overflow-x-auto rounded-2xl">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/60">
              {['Invoice #', 'Family', 'Status', 'Due Date', 'Total', 'Paid', ''].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {invoices.isLoading && [1, 2, 3].map((i) => (
              <tr key={i}>
                {[1, 2, 3, 4, 5, 6, 7].map((j) => (
                  <td key={j} className="px-5 py-4"><div className="skeleton h-4 w-20" /></td>
                ))}
              </tr>
            ))}
            {invoices.data?.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-14 text-center">
                  <FileText size={32} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm text-gray-400">No invoices yet</p>
                </td>
              </tr>
            )}
            {invoices.data?.map((inv) => {
              const fam = inv.families as unknown as { parent_first_name: string; parent_last_name: string } | null;
              return (
                <tr key={inv.id} className="transition-colors hover:bg-indigo-50/40">
                  <td className="px-5 py-3.5 text-sm font-medium text-indigo-600">{inv.invoice_number}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">
                    {fam ? `${fam.parent_first_name} ${fam.parent_last_name}` : '—'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{inv.due_date}</td>
                  <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{formatCents(inv.total)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-600">{formatCents(inv.amount_paid)}</td>
                  <td className="px-5 py-3.5">
                    <button
                      onClick={() => onView(inv.id)}
                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
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
    </>
  );
}

// ── Create Invoice ───────────────────────────────────────

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
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Back to Invoices
      </button>

      <div className="glass-card max-w-lg rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Invoice</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Family</label>
            <select
              value={familyId}
              onChange={(e) => setFamilyId(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900"
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={create.isPending || !familyId || !dueDate}
            className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            {create.isPending ? 'Creating...' : 'Create Invoice'}
          </button>
          {create.isError && <p className="text-sm text-red-600">{create.error.message}</p>}
        </form>
      </div>
    </div>
  );
}

// ── Invoice Detail ───────────────────────────────────────

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
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ChevronLeft size={16} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{inv.invoice_number}</h2>
            <p className="text-sm text-gray-500">
              {fam ? `${fam.parent_first_name} ${fam.parent_last_name} (${fam.email})` : '—'}
            </p>
            <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
              <span>Issued: {inv.issue_date}</span>
              <span>Due: {inv.due_date}</span>
            </div>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
              {inv.status}
            </span>
            <p className="mt-2 text-2xl font-bold text-gray-900">{formatCents(inv.total)}</p>
            {inv.amount_paid > 0 && (
              <p className="text-sm text-emerald-600">Paid: {formatCents(inv.amount_paid)}</p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {inv.status === 'draft' && (
            <button
              onClick={() => sendInv.mutate({ id })}
              disabled={sendInv.isPending || inv.total === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Send size={14} /> {sendInv.isPending ? 'Sending...' : 'Send Invoice'}
            </button>
          )}
          {['sent', 'partial', 'overdue'].includes(inv.status) && (
            <button
              onClick={() => markPaid.mutate({ id })}
              disabled={markPaid.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle size={14} /> {markPaid.isPending ? 'Marking...' : 'Mark Paid'}
            </button>
          )}
          {inv.status !== 'paid' && inv.status !== 'void' && (
            <button
              onClick={() => voidInv.mutate({ id })}
              disabled={voidInv.isPending}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gray-200 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-50"
            >
              <XCircle size={14} /> {voidInv.isPending ? 'Voiding...' : 'Void'}
            </button>
          )}
        </div>
        {(sendInv.isError || markPaid.isError || voidInv.isError) && (
          <p className="mt-2 text-sm text-red-600">
            {sendInv.error?.message ?? markPaid.error?.message ?? voidInv.error?.message}
          </p>
        )}
      </div>

      {/* Line Items */}
      <div className="glass-card rounded-2xl overflow-hidden mb-6">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/60">
              {['Description', 'Qty', 'Unit Price', 'Total', ''].map((h) => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-gray-400">No line items yet</td>
              </tr>
            )}
            {items.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 text-sm text-gray-900">{item.description}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{item.quantity}</td>
                <td className="px-5 py-3 text-sm text-gray-600">{formatCents(item.unit_price)}</td>
                <td className="px-5 py-3 text-sm font-medium text-gray-900">{formatCents(item.total)}</td>
                <td className="px-5 py-3">
                  {canEdit && (
                    <button
                      onClick={() => removeItem.mutate({ id: item.id })}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {/* Totals */}
            <tr className="bg-gray-50/40">
              <td colSpan={3} className="px-5 py-2 text-right text-xs font-medium text-gray-500">Subtotal</td>
              <td className="px-5 py-2 text-sm font-medium text-gray-900">{formatCents(inv.subtotal)}</td>
              <td />
            </tr>
            {inv.tax_rate > 0 && (
              <tr className="bg-gray-50/40">
                <td colSpan={3} className="px-5 py-2 text-right text-xs font-medium text-gray-500">Tax ({(inv.tax_rate * 100).toFixed(2)}%)</td>
                <td className="px-5 py-2 text-sm font-medium text-gray-900">{formatCents(inv.tax_amount)}</td>
                <td />
              </tr>
            )}
            <tr className="bg-gray-50/60">
              <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-900">Total</td>
              <td className="px-5 py-3 text-sm font-bold text-gray-900">{formatCents(inv.total)}</td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>

      {/* Add Line Item */}
      {canEdit && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Line Item</h3>
          <form onSubmit={handleAddItem} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input
                value={newItem.description}
                onChange={(e) => setNewItem((p) => ({ ...p, description: e.target.value }))}
                required
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                placeholder="e.g. Monthly tuition - Ballet"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs text-gray-500 mb-1">Qty</label>
              <input
                type="number"
                min="1"
                value={newItem.quantity}
                onChange={(e) => setNewItem((p) => ({ ...p, quantity: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <div className="w-32">
              <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={newItem.unit_price}
                onChange={(e) => setNewItem((p) => ({ ...p, unit_price: e.target.value }))}
                required
                placeholder="0.00"
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={addItem.isPending}
              className="inline-flex h-9 items-center gap-1 rounded-lg bg-indigo-600 px-4 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus size={14} /> {addItem.isPending ? 'Adding...' : 'Add'}
            </button>
          </form>
          {addItem.isError && <p className="mt-2 text-sm text-red-600">{addItem.error.message}</p>}
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="mt-4 glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}
