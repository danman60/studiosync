'use client';

import { useState, useMemo } from 'react';
import { useStudio } from '@/contexts/StudioContext';
import { trpc } from '@/lib/trpc';
import { Save, Settings, Palette, CreditCard, ExternalLink, CheckCircle, Loader2, Clock } from 'lucide-react';

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

  const inputClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">Studio configuration and preferences.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Studio Info */}
        <div className="glass-card-static rounded-2xl p-6 animate-fade-in-up stagger-1">
          <h2 className="section-heading text-sm mb-4">
            <Settings size={16} className="text-indigo-500" /> Studio Information
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Studio Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Slug</label>
              <input readOnly value={studio?.slug ?? ''} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-sm text-gray-500" />
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
        <div className="glass-card-static rounded-2xl p-6 animate-fade-in-up stagger-2">
          <h2 className="section-heading text-sm mb-4">
            <Palette size={16} className="text-purple-500" /> Branding
          </h2>
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

        {/* Late Fees */}
        <LateFeeSettings />

        {/* Stripe Connect */}
        <StripeConnectSection />

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMut.isPending}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
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

function LateFeeSettings() {
  const settings = trpc.admin.getSettings.useQuery();
  const utils = trpc.useUtils();
  const updateSettings = trpc.admin.updateSettings.useMutation({
    onSuccess: () => {
      utils.admin.getSettings.invalidate();
      setFeeSaved(true);
      setTimeout(() => setFeeSaved(false), 2000);
    },
  });

  const [feeSaved, setFeeSaved] = useState(false);

  const s = settings.data ?? {};
  const [feeType, setFeeType] = useState(String(s.late_fee_type ?? 'flat'));
  const [feeAmount, setFeeAmount] = useState(String(Number(s.late_fee_amount ?? 0) / 100));
  const [graceDays, setGraceDays] = useState(String(s.late_fee_grace_days ?? 0));

  // Sync when data loads
  const [loaded, setLoaded] = useState(false);
  if (settings.data && !loaded) {
    setLoaded(true);
    setFeeType(String(settings.data.late_fee_type ?? 'flat'));
    setFeeAmount(String(Number(settings.data.late_fee_amount ?? 0) / 100));
    setGraceDays(String(settings.data.late_fee_grace_days ?? 0));
  }

  const handleSaveFees = () => {
    const amountCents = Math.round(parseFloat(feeAmount || '0') * 100);
    updateSettings.mutate({
      late_fee_type: feeType,
      late_fee_amount: amountCents,
      late_fee_grace_days: parseInt(graceDays || '0', 10),
    });
  };

  const inputClass = 'h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-900 transition-shadow input-glow';

  return (
    <div className="glass-card-static rounded-2xl p-6 animate-fade-in-up stagger-3">
      <h2 className="section-heading text-sm mb-4">
        <Clock size={16} className="text-amber-500" /> Late Fee Policy
      </h2>
      <p className="text-xs text-gray-500 mb-4">
        Configure automatic late fees for overdue invoices. Fees are applied once per invoice.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Fee Type</label>
          <select
            value={feeType}
            onChange={(e) => setFeeType(e.target.value)}
            className={inputClass}
          >
            <option value="flat">Flat Amount ($)</option>
            <option value="percent">Percentage (%)</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            {feeType === 'percent' ? 'Fee Percentage' : 'Fee Amount'}
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
              {feeType === 'percent' ? '%' : '$'}
            </span>
            <input
              type="number"
              step={feeType === 'percent' ? '0.5' : '0.01'}
              min="0"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              className={`${inputClass} pl-7`}
              placeholder="0"
            />
          </div>
          <p className="mt-1 text-[10px] text-gray-400">
            {feeType === 'percent' ? 'e.g. 5 = 5% of invoice total' : 'e.g. 25 = $25.00 flat fee'}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Grace Period (days)</label>
          <input
            type="number"
            min="0"
            value={graceDays}
            onChange={(e) => setGraceDays(e.target.value)}
            className={inputClass}
            placeholder="0"
          />
          <p className="mt-1 text-[10px] text-gray-400">Days after due date before fee applies</p>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSaveFees}
          disabled={updateSettings.isPending}
          className="btn-gradient inline-flex h-10 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
        >
          <Save size={14} />
          {updateSettings.isPending ? 'Saving...' : 'Save Late Fee Policy'}
        </button>
        {feeSaved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
        {updateSettings.isError && <span className="text-sm text-red-600">{updateSettings.error.message}</span>}
      </div>

      <p className="mt-3 text-xs text-gray-400">
        Set amount to $0 to disable late fees. Invoices are marked overdue and fees applied daily via automated processing.
      </p>
    </div>
  );
}

function StripeConnectSection() {
  const status = trpc.admin.stripeConnectStatus.useQuery();
  const connectMut = trpc.admin.stripeConnectUrl.useMutation({
    onSuccess: (data) => {
      window.location.href = data.url;
    },
  });

  return (
    <div className="glass-card-static rounded-2xl p-6 animate-fade-in-up stagger-3">
      <h2 className="section-heading text-sm mb-4">
        <CreditCard size={16} className="text-emerald-500" /> Payment Integration
      </h2>

      {status.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Loader2 size={16} className="animate-spin" /> Checking Stripe status...
        </div>
      ) : status.data?.connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={18} className="text-emerald-500" />
            <span className="text-sm font-medium text-emerald-700">Stripe Connected</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${status.data.chargesEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              Charges {status.data.chargesEnabled ? 'enabled' : 'disabled'}
            </span>
            <span className="flex items-center gap-1">
              <span className={`h-2 w-2 rounded-full ${status.data.payoutsEnabled ? 'bg-emerald-500' : 'bg-gray-300'}`} />
              Payouts {status.data.payoutsEnabled ? 'enabled' : 'disabled'}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Connect your Stripe account to accept online payments from families.
          </p>
          <button
            onClick={() => connectMut.mutate()}
            disabled={connectMut.isPending}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
          >
            {connectMut.isPending ? (
              <><Loader2 size={16} className="animate-spin" /> Redirecting...</>
            ) : (
              <><ExternalLink size={16} /> Connect with Stripe</>
            )}
          </button>
          {connectMut.isError && (
            <p className="text-sm text-red-600">{connectMut.error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
