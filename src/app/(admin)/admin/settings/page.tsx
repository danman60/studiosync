'use client';

import { useState, useMemo } from 'react';
import { useStudio } from '@/contexts/StudioContext';
import { trpc } from '@/lib/trpc';
import { Save, Settings, Palette, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const { studio } = useStudio();
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);

  const initialForm = useMemo(() => ({
    name: studio?.name ?? '',
    email: studio?.email ?? '',
    phone: studio?.phone ?? '',
    website: studio?.website ?? '',
    address_line1: studio?.address_line1 ?? '',
    city: studio?.city ?? '',
    state: studio?.state ?? '',
    zip: studio?.zip ?? '',
    primary_color: studio?.primary_color ?? '#6366f1',
    secondary_color: studio?.secondary_color ?? '#818cf8',
  }), [studio]);

  const [form, setForm] = useState(initialForm);

  // Reset form when studio data changes (e.g. after save)
  const [lastStudioId, setLastStudioId] = useState(studio?.id);
  if (studio?.id && studio.id !== lastStudioId) {
    setLastStudioId(studio.id);
    setForm({
      name: studio.name ?? '',
      email: studio.email ?? '',
      phone: studio.phone ?? '',
      website: studio.website ?? '',
      address_line1: studio.address_line1 ?? '',
      city: studio.city ?? '',
      state: studio.state ?? '',
      zip: studio.zip ?? '',
      primary_color: studio.primary_color ?? '#6366f1',
      secondary_color: studio.secondary_color ?? '#818cf8',
    });
  }

  const updateMut = trpc.admin.updateStudio.useMutation({
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      utils.invalidate();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({
      name: form.name || undefined,
      email: form.email || null,
      phone: form.phone || null,
      website: form.website || null,
      address_line1: form.address_line1 || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
      primary_color: form.primary_color || null,
      secondary_color: form.secondary_color || null,
    });
  };

  const inputClass = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Studio configuration and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Studio Info */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={16} className="text-indigo-500" />
            <h2 className="text-lg font-semibold text-gray-900">Studio Information</h2>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Studio Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug</label>
              <input readOnly value={studio?.slug ?? ''} className="h-10 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-sm text-gray-500" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Website</label>
              <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className={inputClass} placeholder="https://..." />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-gray-600">Address</label>
              <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">City</label>
              <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className={inputClass} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">ZIP</label>
                <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className={inputClass} />
              </div>
            </div>
          </div>
        </div>

        {/* Branding */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Palette size={16} className="text-purple-500" />
            <h2 className="text-lg font-semibold text-gray-900">Branding</h2>
          </div>
          <div className="flex items-center gap-8">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Primary Color</label>
              <div className="mt-1 flex items-center gap-2.5">
                <input
                  type="color"
                  value={form.primary_color}
                  onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200"
                />
                <span className="text-sm text-gray-600">{form.primary_color}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Secondary Color</label>
              <div className="mt-1 flex items-center gap-2.5">
                <input
                  type="color"
                  value={form.secondary_color}
                  onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                  className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200"
                />
                <span className="text-sm text-gray-600">{form.secondary_color}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stripe Status (read-only) */}
        <div className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard size={16} className="text-emerald-500" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Integration</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${studio?.stripe_onboarding_complete ? 'bg-emerald-500' : 'bg-gray-300'}`} />
            <span className="text-sm text-gray-700">
              Stripe: {studio?.stripe_onboarding_complete ? 'Connected' : 'Not connected'}
            </span>
          </div>
          {studio?.stripe_account_id && (
            <p className="mt-2 text-xs text-gray-400">Account: {studio.stripe_account_id}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMut.isPending}
            className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {updateMut.isPending ? 'Saving...' : 'Save Settings'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
          {updateMut.isError && <span className="text-sm text-red-600">{updateMut.error.message}</span>}
        </div>
      </form>
    </div>
  );
}
