'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { User, Save, MapPin, Shield } from 'lucide-react';

export default function ParentProfilePage() {
  const { data: profile, isLoading } = trpc.portal.getProfile.useQuery();
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);

  const initialForm = useMemo(() => ({
    parent_first_name: profile?.parent_first_name ?? '',
    parent_last_name: profile?.parent_last_name ?? '',
    phone: profile?.phone ?? '',
    emergency_contact_name: profile?.emergency_contact_name ?? '',
    emergency_contact_phone: profile?.emergency_contact_phone ?? '',
    address_line1: profile?.address_line1 ?? '',
    address_line2: profile?.address_line2 ?? '',
    city: profile?.city ?? '',
    state: profile?.state ?? '',
    zip: profile?.zip ?? '',
  }), [profile]);

  const [form, setForm] = useState(initialForm);

  // Sync form when profile data loads
  const [lastProfileEmail, setLastProfileEmail] = useState(profile?.email);
  if (profile?.email && profile.email !== lastProfileEmail) {
    setLastProfileEmail(profile.email);
    setForm({
      parent_first_name: profile.parent_first_name ?? '',
      parent_last_name: profile.parent_last_name ?? '',
      phone: profile.phone ?? '',
      emergency_contact_name: profile.emergency_contact_name ?? '',
      emergency_contact_phone: profile.emergency_contact_phone ?? '',
      address_line1: profile.address_line1 ?? '',
      address_line2: profile.address_line2 ?? '',
      city: profile.city ?? '',
      state: profile.state ?? '',
      zip: profile.zip ?? '',
    });
  }

  const updateMut = trpc.portal.updateProfile.useMutation({
    onSuccess: () => {
      utils.portal.getProfile.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMut.mutate({
      parent_first_name: form.parent_first_name || undefined,
      parent_last_name: form.parent_last_name || undefined,
      phone: form.phone || null,
      emergency_contact_name: form.emergency_contact_name || null,
      emergency_contact_phone: form.emergency_contact_phone || null,
      address_line1: form.address_line1 || null,
      address_line2: form.address_line2 || null,
      city: form.city || null,
      state: form.state || null,
      zip: form.zip || null,
    });
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-8">
          <div className="skeleton h-8 w-40" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card-static rounded-2xl p-6">
              <div className="skeleton h-5 w-32 mb-3" />
              <div className="skeleton h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">Update your contact information and address.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Name */}
        <div className="glass-card-static rounded-2xl p-6">
          <h2 className="section-heading text-sm mb-4"><User size={16} className="text-indigo-500" /> Personal Information</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">First Name</label>
              <input value={form.parent_first_name} onChange={(e) => setForm({ ...form, parent_first_name: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Last Name</label>
              <input value={form.parent_last_name} onChange={(e) => setForm({ ...form, parent_last_name: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" placeholder="(555) 123-4567" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Email</label>
              <input readOnly value={profile?.email ?? ''} className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50/80 px-3 text-sm text-gray-500" />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="glass-card-static rounded-2xl p-6">
          <h2 className="section-heading text-sm mb-4"><Shield size={16} className="text-red-500" /> Emergency Contact</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Contact Name</label>
              <input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Contact Phone</label>
              <input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="glass-card-static rounded-2xl p-6">
          <h2 className="section-heading text-sm mb-4"><MapPin size={16} className="text-indigo-500" /> Address</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Address Line 1</label>
              <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Address Line 2</label>
              <input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">City</label>
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">State</label>
                <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">ZIP</label>
                <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
              </div>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={updateMut.isPending}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-6 text-sm font-medium disabled:opacity-50"
          >
            <Save size={16} />
            {updateMut.isPending ? 'Saving...' : 'Save Changes'}
          </button>
          {saved && <span className="text-sm text-emerald-600 font-medium">Saved</span>}
          {updateMut.isError && <span className="text-sm text-red-600">{updateMut.error.message}</span>}
        </div>
      </form>
    </div>
  );
}
