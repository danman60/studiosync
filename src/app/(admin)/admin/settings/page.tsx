'use client';

import { useStudio } from '@/contexts/StudioContext';

export default function SettingsPage() {
  const { studio } = useStudio();

  const inputClass = 'mt-1 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-sm text-gray-700';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Studio configuration and preferences.</p>
      </div>

      <div className="space-y-6">
        {/* Studio Info */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up">
          <h2 className="text-lg font-semibold text-gray-900">Studio Information</h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Studio Name</label>
              <input type="text" readOnly value={studio?.name ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input type="text" readOnly value={studio?.slug ?? ''} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="text" readOnly value={studio?.email ?? '—'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input type="text" readOnly value={studio?.phone ?? '—'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input type="text" readOnly value={studio?.website ?? '—'} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" readOnly
                value={studio ? `${studio.city ?? ''}${studio.state ? `, ${studio.state}` : ''}` : '—'}
                className={inputClass} />
            </div>
          </div>
          <p className="mt-5 text-xs text-gray-400">
            Contact support to update studio name or slug.
          </p>
        </div>

        {/* Theme */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-1">
          <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
          <div className="mt-5 flex items-center gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="mt-2 flex items-center gap-2.5">
                <div
                  className="h-9 w-9 rounded-xl border border-gray-200 shadow-sm"
                  style={{ backgroundColor: studio?.primary_color ?? '#6366f1' }}
                />
                <span className="text-sm text-gray-600">{studio?.primary_color ?? '#6366f1'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <div className="mt-2 flex items-center gap-2.5">
                <div
                  className="h-9 w-9 rounded-xl border border-gray-200 shadow-sm"
                  style={{ backgroundColor: studio?.secondary_color ?? '#818cf8' }}
                />
                <span className="text-sm text-gray-600">{studio?.secondary_color ?? '#818cf8'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Status */}
        <div className="glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
          <h2 className="text-lg font-semibold text-gray-900">Payment Integration</h2>
          <div className="mt-5 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${studio?.stripe_onboarding_complete ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">
              Stripe: {studio?.stripe_onboarding_complete ? 'Connected' : 'Not connected'}
            </span>
          </div>
          {studio?.stripe_account_id && (
            <p className="mt-2 text-xs text-gray-400">Account: {studio.stripe_account_id}</p>
          )}
        </div>
      </div>
    </div>
  );
}
