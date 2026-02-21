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

const STATUS_COLORS: Record<string, string> = {
  succeeded: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  failed: 'bg-red-100 text-red-600',
  refunded: 'bg-gray-100 text-gray-500',
};

export default function PaymentsPage() {
  const payments = trpc.portal.listPayments.useQuery();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
      <p className="mt-1 text-sm text-gray-600">View your payment history.</p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['Date', 'Type', 'Description', 'Amount', 'Status'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-gray-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {payments.isLoading && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">Loading...</td></tr>
            )}
            {payments.data?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <CreditCard size={32} className="mx-auto text-gray-300" />
                  <p className="mt-3 text-sm text-gray-400">No payments yet.</p>
                  <p className="text-xs text-gray-400">Payments will appear here once billing is set up.</p>
                </td>
              </tr>
            )}
            {payments.data?.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-600">
                  {new Date(p.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {TYPE_LABELS[p.type] ?? p.type}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">
                  {p.description ?? '—'}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  ${(p.amount / 100).toFixed(2)} {p.currency.toUpperCase()}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
