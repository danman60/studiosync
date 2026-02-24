'use client';

import { trpc } from '@/lib/trpc';
import { CreditCard } from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  registration: 'Registration',
  tuition: 'Tuition',
  drop_in: 'Drop-in',
  refund: 'Refund',
  other: 'Other',
};

const STATUS_BADGE: Record<string, string> = {
  succeeded: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  pending: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  failed: 'bg-red-500/15 text-red-600 border border-red-500/25',
  refunded: 'bg-stone-500/15 text-stone-500 border border-stone-500/20',
};

export default function PaymentsPage() {
  const payments = trpc.portal.listPayments.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Payments</h1>
        <p className="mt-1 text-sm text-stone-500">View your payment history.</p>
      </div>

      <div className="glass-card-static overflow-hidden rounded-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-stone-100">
            <thead>
              <tr className="bg-stone-50/60">
                {['Date', 'Type', 'Description', 'Amount', 'Status'].map((h) => (
                  <th key={h} className="table-header">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-50">
              {payments.isLoading && [1, 2, 3].map((i) => (
                <tr key={i}>
                  {[1, 2, 3, 4, 5].map((j) => (
                    <td key={j} className="table-cell"><div className="skeleton h-4 w-20" /></td>
                  ))}
                </tr>
              ))}
              {payments.data?.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-cell text-center py-14">
                    <CreditCard size={32} className="mx-auto text-stone-300" />
                    <p className="mt-3 text-sm text-stone-400">No payments yet.</p>
                    <p className="text-xs text-stone-400">Payments will appear here once billing is set up.</p>
                  </td>
                </tr>
              )}
              {payments.data?.map((p) => (
                <tr key={p.id} className="table-row-hover">
                  <td className="table-cell text-stone-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="table-cell text-stone-600">
                    {TYPE_LABELS[p.type] ?? p.type}
                  </td>
                  <td className="table-cell text-stone-600">
                    {p.description ?? '—'}
                  </td>
                  <td className="table-cell font-medium text-stone-800">
                    ${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                  </td>
                  <td className="table-cell">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[p.status] ?? 'bg-stone-100 text-stone-600'}`}>
                      {p.status}
                    </span>
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
