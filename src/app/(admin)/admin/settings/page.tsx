'use client';

import { useStudio } from '@/contexts/StudioContext';

export default function SettingsPage() {
  const { studio } = useStudio();

  // For now, display studio info from context (read-only for most fields)
  // Full settings CRUD can be added when studio update procedures exist

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <p className="mt-1 text-sm text-gray-600">Studio configuration and preferences.</p>

      <div className="mt-6 space-y-6">
        {/* Studio Info */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Studio Information</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Studio Name</label>
              <input
                type="text"
                readOnly
                value={studio?.name ?? ''}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Slug</label>
              <input
                type="text"
                readOnly
                value={studio?.slug ?? ''}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="text"
                readOnly
                value={studio?.email ?? '—'}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="text"
                readOnly
                value={studio?.phone ?? '—'}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Website</label>
              <input
                type="text"
                readOnly
                value={studio?.website ?? '—'}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input
                type="text"
                readOnly
                value={studio ? `${studio.city ?? ''}${studio.state ? `, ${studio.state}` : ''}` : '—'}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
              />
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Contact support to update studio name or slug.
          </p>
        </div>

        {/* Theme */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
          <div className="mt-4 flex items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Primary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border border-gray-200"
                  style={{ backgroundColor: studio?.primary_color ?? '#6366f1' }}
                />
                <span className="text-sm text-gray-600">{studio?.primary_color ?? '#6366f1'}</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Secondary Color</label>
              <div className="mt-1 flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded-lg border border-gray-200"
                  style={{ backgroundColor: studio?.secondary_color ?? '#818cf8' }}
                />
                <span className="text-sm text-gray-600">{studio?.secondary_color ?? '#818cf8'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Status */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-gray-900">Payment Integration</h2>
          <div className="mt-4 flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${studio?.stripe_onboarding_complete ? 'bg-green-500' : 'bg-gray-300'}`} />
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
