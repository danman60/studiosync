'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { FileText, ChevronLeft, CreditCard, RefreshCw, XCircle } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  sent: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
  paid: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  partial: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  overdue: 'bg-red-500/15 text-red-600 border border-red-500/25',
  active: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  past_due: 'bg-red-500/15 text-red-600 border border-red-500/25',
  paused: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
};

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function ParentInvoicesPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (selectedId) {
    return <InvoiceDetail id={selectedId} onBack={() => setSelectedId(null)} />;
  }

  return <InvoiceList onView={setSelectedId} />;
}

// ── Invoice List ─────────────────────────────────────────

function InvoiceList({ onView }: { onView: (id: string) => void }) {
  const invoices = trpc.invoice.myInvoices.useQuery();
  const plans = trpc.tuition.myPlans.useQuery();

  const unpaid = (invoices.data ?? []).filter((i) => ['sent', 'partial', 'overdue'].includes(i.status));
  const paid = (invoices.data ?? []).filter((i) => i.status === 'paid');
  const activePlans = plans.data ?? [];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Invoices & Auto-Pay</h1>
        <p className="mt-1 text-sm text-gray-500">View invoices and manage your auto-pay plans.</p>
      </div>

      {/* Active Auto-Pay Plans */}
      {activePlans.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Auto-Pay Plans</h2>
          <div className="space-y-3">
            {activePlans.map((plan) => (
              <AutoPayCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {invoices.isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-6">
              <div className="skeleton h-5 w-32 mb-2" />
              <div className="skeleton h-4 w-48" />
            </div>
          ))}
        </div>
      )}

      {!invoices.isLoading && (invoices.data?.length ?? 0) === 0 && activePlans.length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <FileText size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No invoices yet</p>
          <p className="mt-1 text-xs text-gray-400">Invoices from your studio will appear here.</p>
        </div>
      )}

      {/* Unpaid invoices */}
      {unpaid.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Due</h2>
          <div className="space-y-3">
            {unpaid.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onView(inv.id)}
                className="glass-card flex w-full items-center justify-between rounded-2xl p-5 text-left"
              >
                <div>
                  <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                  <p className="text-sm text-gray-500">Due: {inv.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCents(inv.total - inv.amount_paid)}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
                    {inv.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Paid invoices */}
      {paid.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-3">Paid</h2>
          <div className="space-y-3">
            {paid.map((inv) => (
              <button
                key={inv.id}
                onClick={() => onView(inv.id)}
                className="glass-card flex w-full items-center justify-between rounded-2xl p-5 text-left opacity-75"
              >
                <div>
                  <p className="font-medium text-gray-900">{inv.invoice_number}</p>
                  <p className="text-sm text-gray-500">Paid: {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : inv.due_date}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">{formatCents(inv.total)}</p>
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE.paid}`}>
                    paid
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Auto-Pay Card ────────────────────────────────────────

function AutoPayCard({ plan }: { plan: { id: string; name: string; description: string | null; amount: number; interval: string; status: string; cancel_at_period_end: boolean; current_period_end: string | null } }) {
  const utils = trpc.useUtils();
  const requestCancel = trpc.tuition.requestCancel.useMutation({
    onSuccess: () => {
      utils.tuition.myPlans.invalidate();
    },
  });

  return (
    <div className="glass-card rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600">
            <RefreshCw size={18} />
          </div>
          <div>
            <p className="font-medium text-gray-900">{plan.name}</p>
            {plan.description && <p className="text-xs text-gray-500">{plan.description}</p>}
            <div className="mt-1 flex items-center gap-2">
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[plan.status] ?? ''}`}>
                {plan.status.replace('_', ' ')}
              </span>
              {plan.cancel_at_period_end && (
                <span className="text-[11px] text-amber-600 font-medium">Cancels at period end</span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">{formatCents(plan.amount)}</p>
          <p className="text-xs text-gray-500">/{plan.interval}</p>
          {plan.current_period_end && (
            <p className="text-xs text-gray-400 mt-1">
              Next: {new Date(plan.current_period_end).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      {plan.status === 'active' && !plan.cancel_at_period_end && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => {
              if (confirm('Request cancellation? Your plan will remain active until the end of the current billing period.')) {
                requestCancel.mutate({ id: plan.id });
              }
            }}
            disabled={requestCancel.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
          >
            <XCircle size={14} /> {requestCancel.isPending ? 'Requesting...' : 'Cancel Auto-Pay'}
          </button>
          {requestCancel.isError && (
            <p className="mt-1 text-xs text-red-600">{requestCancel.error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Invoice Detail ───────────────────────────────────────

function InvoiceDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const invoice = trpc.invoice.myInvoiceDetail.useQuery({ id });
  const utils = trpc.useUtils();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const createPI = trpc.invoice.createPaymentIntent.useMutation({
    onSuccess: () => {
      setPaymentStatus('idle');
      utils.invoice.myInvoices.invalidate();
      utils.invoice.myInvoiceDetail.invalidate({ id });
    },
    onError: () => {
      setPaymentStatus('error');
    },
  });

  const inv = invoice.data;
  const items = (inv?.invoice_line_items ?? []) as unknown as Array<{
    id: string;
    description: string;
    quantity: number;
    unit_price: number;
    total: number;
  }>;

  const canPay = inv && ['sent', 'partial', 'overdue'].includes(inv.status);
  const amountDue = inv ? inv.total - inv.amount_paid : 0;

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
      <button onClick={onBack} className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
        <ChevronLeft size={16} /> Back to Invoices
      </button>

      {/* Header */}
      <div className="glass-card-static rounded-2xl p-6 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{inv.invoice_number}</h2>
            <p className="text-sm text-gray-500">Issued: {inv.issue_date} | Due: {inv.due_date}</p>
          </div>
          <div className="text-right">
            <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-medium ${STATUS_BADGE[inv.status] ?? ''}`}>
              {inv.status}
            </span>
            <p className="mt-2 stat-number">{formatCents(inv.total)}</p>
            {inv.amount_paid > 0 && inv.status !== 'paid' && (
              <p className="text-sm text-emerald-600">Paid: {formatCents(inv.amount_paid)}</p>
            )}
          </div>
        </div>
      </div>

      {/* Line Items */}
      <div className="glass-card-static overflow-hidden rounded-2xl mb-6">
        <table className="min-w-full divide-y divide-gray-100">
          <thead>
            <tr className="bg-gray-50/60">
              <th className="table-header">Description</th>
              <th className="table-header text-center">Qty</th>
              <th className="table-header text-center">Price</th>
              <th className="table-header text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item) => (
              <tr key={item.id} className="table-row-hover">
                <td className="table-cell text-gray-900">{item.description}</td>
                <td className="table-cell text-center text-gray-600">{item.quantity}</td>
                <td className="table-cell text-center text-gray-600">{formatCents(item.unit_price)}</td>
                <td className="table-cell text-right font-medium text-gray-900">{formatCents(item.total)}</td>
              </tr>
            ))}
            <tr className="bg-gray-50/40">
              <td colSpan={3} className="px-5 py-2 text-right text-xs font-medium text-gray-500">Subtotal</td>
              <td className="px-5 py-2 text-right text-sm font-medium text-gray-900">{formatCents(inv.subtotal)}</td>
            </tr>
            {inv.tax_rate > 0 && (
              <tr className="bg-gray-50/40">
                <td colSpan={3} className="px-5 py-2 text-right text-xs font-medium text-gray-500">Tax</td>
                <td className="px-5 py-2 text-right text-sm font-medium text-gray-900">{formatCents(inv.tax_amount)}</td>
              </tr>
            )}
            <tr className="bg-gray-50/60">
              <td colSpan={3} className="px-5 py-3 text-right text-sm font-semibold text-gray-900">
                {canPay ? 'Amount Due' : 'Total'}
              </td>
              <td className="px-5 py-3 text-right text-sm font-bold text-gray-900">
                {canPay ? formatCents(amountDue) : formatCents(inv.total)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Pay Button */}
      {canPay && amountDue > 0 && (
        <div className="glass-card-static rounded-2xl p-6 text-center">
          <button
            onClick={() => {
              setPaymentStatus('loading');
              createPI.mutate({ invoiceId: id });
            }}
            disabled={paymentStatus === 'loading' || createPI.isPending}
            className="btn-gradient inline-flex h-12 items-center gap-2 rounded-xl px-8 text-sm font-medium disabled:opacity-50"
          >
            <CreditCard size={18} />
            {createPI.isPending ? 'Processing...' : `Pay ${formatCents(amountDue)}`}
          </button>
          {createPI.isSuccess && (
            <p className="mt-3 text-sm text-emerald-600">
              Payment initiated. You will receive a confirmation when complete.
            </p>
          )}
          {createPI.isError && (
            <p className="mt-3 text-sm text-red-600">{createPI.error.message}</p>
          )}
          <p className="mt-2 text-xs text-gray-400">Secure payment powered by Stripe</p>
        </div>
      )}

      {/* Notes */}
      {inv.notes && (
        <div className="mt-4 glass-card-static rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Notes</h3>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{inv.notes}</p>
        </div>
      )}
    </div>
  );
}
