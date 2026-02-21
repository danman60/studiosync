'use client';

import { CreditCard, ExternalLink } from 'lucide-react';

export default function BillingPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Billing</h1>
      <p className="mt-1 text-sm text-gray-600">Manage payments, tuition plans, and Stripe integration.</p>

      <div className="mt-8 flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50">
          <CreditCard size={28} className="text-indigo-600" />
        </div>
        <h2 className="mt-4 text-lg font-semibold text-gray-900">Stripe Integration</h2>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Connect your Stripe account to accept online payments, set up recurring tuition billing,
          and track all transactions from this dashboard.
        </p>
        <div className="mt-6 space-y-3">
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white opacity-50"
          >
            <ExternalLink size={16} /> Connect Stripe Account
          </button>
          <p className="text-xs text-gray-400">
            Stripe keys must be configured in environment variables to enable this feature.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Registration Fees</h3>
          <p className="mt-1 text-xs text-gray-500">One-time fees collected at enrollment</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">—</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Monthly Tuition</h3>
          <p className="mt-1 text-xs text-gray-500">Recurring subscription revenue</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">—</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-gray-900">Drop-in Revenue</h3>
          <p className="mt-1 text-xs text-gray-500">Per-class payments</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">—</p>
        </div>
      </div>
    </div>
  );
}
