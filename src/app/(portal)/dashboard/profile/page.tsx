'use client';

import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { User, Save, MapPin, Shield, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';

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
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">My Profile</h1>
        <p className="mt-1 text-sm text-stone-500">Update your contact information and notification preferences.</p>
      </div>

      <div className="space-y-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
          {/* Name */}
          <div className="glass-card-static rounded-2xl p-6">
            <h2 className="section-heading text-sm mb-4"><User size={16} className="text-primary" /> Personal Information</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">First Name</label>
                <input value={form.parent_first_name} onChange={(e) => setForm({ ...form, parent_first_name: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Last Name</label>
                <input value={form.parent_last_name} onChange={(e) => setForm({ ...form, parent_last_name: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" placeholder="(555) 123-4567" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Email</label>
                <input readOnly value={profile?.email ?? ''} className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50/80 px-3 text-sm text-stone-500" />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="glass-card-static rounded-2xl p-6">
            <h2 className="section-heading text-sm mb-4"><Shield size={16} className="text-red-500" /> Emergency Contact</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Contact Name</label>
                <input value={form.emergency_contact_name} onChange={(e) => setForm({ ...form, emergency_contact_name: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Contact Phone</label>
                <input value={form.emergency_contact_phone} onChange={(e) => setForm({ ...form, emergency_contact_phone: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="glass-card-static rounded-2xl p-6">
            <h2 className="section-heading text-sm mb-4"><MapPin size={16} className="text-primary" /> Address</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Address Line 1</label>
                <input value={form.address_line1} onChange={(e) => setForm({ ...form, address_line1: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-stone-600">Address Line 2</label>
                <input value={form.address_line2} onChange={(e) => setForm({ ...form, address_line2: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">State</label>
                  <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-stone-600">ZIP</label>
                  <input value={form.zip} onChange={(e) => setForm({ ...form, zip: e.target.value })} className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow" />
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

        <NotificationSettings />
      </div>
    </div>
  );
}

function NotificationSettings() {
  const { data: prefs, isLoading } = trpc.notification.getPreferences.useQuery();
  const utils = trpc.useUtils();
  const [saved, setSaved] = useState(false);

  const updateMut = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      utils.notification.getPreferences.invalidate();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const toggle = (key: string, value: boolean) => {
    updateMut.mutate({ [key]: value });
  };

  if (isLoading) {
    return (
      <div className="glass-card-static rounded-2xl p-6 max-w-2xl">
        <div className="skeleton h-5 w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-10 w-full rounded-xl" />)}
        </div>
      </div>
    );
  }

  const channels = [
    { key: 'email_enabled', label: 'Email', icon: <Mail size={16} />, desc: 'Receive notifications via email' },
    { key: 'sms_enabled', label: 'SMS', icon: <Smartphone size={16} />, desc: 'Receive text message alerts' },
  ];

  const types = [
    { key: 'invoice_notifications', label: 'Invoices & Billing', desc: 'New invoices, payment confirmations' },
    { key: 'enrollment_notifications', label: 'Enrollments', desc: 'Enrollment confirmations and updates' },
    { key: 'message_notifications', label: 'Messages', desc: 'New messages from the studio' },
    { key: 'announcement_notifications', label: 'Announcements', desc: 'Studio announcements and news' },
    { key: 'event_notifications', label: 'Events', desc: 'Upcoming events and ticket info' },
    { key: 'attendance_notifications', label: 'Attendance', desc: 'Attendance alerts and summaries' },
    { key: 'progress_notifications', label: 'Progress Reports', desc: 'New marks and report cards' },
  ];

  return (
    <div className="max-w-2xl space-y-6">
      {/* Channels */}
      <div className="glass-card-static rounded-2xl p-6">
        <h2 className="section-heading text-sm mb-4">
          <Bell size={16} className="text-primary" /> Notification Channels
        </h2>
        <div className="space-y-3">
          {channels.map((ch) => (
            <div key={ch.key} className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-stone-400">{ch.icon}</span>
                <div>
                  <p className="text-sm font-medium text-stone-700">{ch.label}</p>
                  <p className="text-xs text-stone-400">{ch.desc}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => toggle(ch.key, !(prefs as Record<string, unknown>)?.[ch.key])}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  (prefs as Record<string, unknown>)?.[ch.key] ? 'bg-primary' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    (prefs as Record<string, unknown>)?.[ch.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* SMS phone number */}
        {prefs?.sms_enabled && (
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-stone-600">SMS Phone Number</label>
            <input
              type="tel"
              defaultValue={prefs?.phone_number ?? ''}
              placeholder="(555) 123-4567"
              className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm input-glow"
              onBlur={(e) => {
                if (e.target.value !== (prefs?.phone_number ?? '')) {
                  updateMut.mutate({ phone_number: e.target.value || null });
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Notification Types */}
      <div className="glass-card-static rounded-2xl p-6">
        <h2 className="section-heading text-sm mb-4">
          <MessageSquare size={16} className="text-primary" /> Notification Types
        </h2>
        <div className="space-y-2">
          {types.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-xl bg-stone-50/80 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-stone-700">{t.label}</p>
                <p className="text-xs text-stone-400">{t.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggle(t.key, !(prefs as Record<string, unknown>)?.[t.key])}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  (prefs as Record<string, unknown>)?.[t.key] ? 'bg-primary' : 'bg-stone-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    (prefs as Record<string, unknown>)?.[t.key] ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {saved && (
        <p className="text-sm text-emerald-600 font-medium">Preferences saved</p>
      )}
    </div>
  );
}
