'use client';

import { CreditCard, ExternalLink } from 'lucide-react';

export default function BillingPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Billing</h1>
        <p className="mt-1 text-sm text-gray-500">Manage payments, tuition plans, and Stripe integration.</p>
      </div>

      <div className="glass-card flex flex-col items-center rounded-2xl border-dashed border-2 border-gray-200/60 px-6 py-16 text-center animate-fade-in-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
          <CreditCard size={28} className="text-indigo-600" />
        </div>
        <h2 className="mt-5 text-lg font-semibold text-gray-900">Stripe Integration</h2>
        <p className="mt-2 max-w-md text-sm text-gray-600">
          Connect your Stripe account to accept online payments, set up recurring tuition billing,
          and track all transactions from this dashboard.
        </p>
        <div className="mt-6 space-y-3">
          <button
            disabled
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium opacity-50"
          >
            <ExternalLink size={16} /> Connect Stripe Account
          </button>
          <p className="text-xs text-gray-400">
            Stripe keys must be configured in environment variables to enable this feature.
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Registration Fees', desc: 'One-time fees collected at enrollment' },
          { label: 'Monthly Tuition', desc: 'Recurring subscription revenue' },
          { label: 'Drop-in Revenue', desc: 'Per-class payments' },
        ].map((card, i) => (
          <div key={card.label} className={`glass-card rounded-2xl p-6 animate-fade-in-up stagger-${i + 1}`}>
            <h3 className="text-sm font-semibold text-gray-900">{card.label}</h3>
            <p className="mt-1 text-xs text-gray-500">{card.desc}</p>
            <p className="mt-4 text-2xl font-bold text-gray-900">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
