'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Ticket,
  Trash2,
  Eye,
  Users,
  DollarSign,
  ChevronLeft,
} from 'lucide-react';
import { Modal } from '@/components/admin/Modal';

const STATUS_BADGE: Record<string, string> = {
  draft: 'bg-gray-500/15 text-gray-600 border border-gray-500/20',
  published: 'bg-emerald-500/15 text-emerald-600 border border-emerald-500/25',
  cancelled: 'bg-red-500/15 text-red-600 border border-red-500/25',
  completed: 'bg-blue-500/15 text-blue-600 border border-blue-500/25',
};

function formatCents(cents: number) {
  return cents === 0 ? 'Free' : `$${(cents / 100).toFixed(2)}`;
}

function formatTime(t: string | null) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function EventsPage() {
  const [view, setView] = useState<'list' | 'orders'>('list');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const utils = trpc.useUtils();

  const { data: events, isLoading } = trpc.event.list.useQuery();
  const createMut = trpc.event.create.useMutation({ onSuccess: () => { utils.event.list.invalidate(); setShowCreate(false); } });
  const updateMut = trpc.event.update.useMutation({ onSuccess: () => { utils.event.list.invalidate(); void 0; } });
  const deleteMut = trpc.event.delete.useMutation({ onSuccess: () => utils.event.list.invalidate() });
  const { data: orders } = trpc.event.orders.useQuery(
    { eventId: selectedEventId! },
    { enabled: !!selectedEventId && view === 'orders' }
  );

  if (view === 'orders' && selectedEventId) {
    const event = events?.find((e) => e.id === selectedEventId);
    return (
      <div>
        <button onClick={() => { setView('list'); setSelectedEventId(null); }} className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
          <ChevronLeft size={16} /> Back to Events
        </button>
        <div className="mb-6">
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Ticket Orders</h1>
          <p className="mt-1 text-sm text-gray-500">{event?.name ?? 'Event'}</p>
        </div>
        <div className="glass-card-static overflow-hidden rounded-2xl">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                <th className="table-header">Buyer</th>
                <th className="table-header">Email</th>
                <th className="table-header text-center">Qty</th>
                <th className="table-header text-center">Amount</th>
                <th className="table-header text-center">Status</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(orders ?? []).map((o) => (
                <tr key={o.id} className="table-row-hover">
                  <td className="table-cell font-medium text-gray-900">{o.buyer_name}</td>
                  <td className="table-cell text-gray-500">{o.buyer_email}</td>
                  <td className="table-cell text-center text-gray-700">{o.quantity}</td>
                  <td className="table-cell text-center text-gray-700">{formatCents(o.total_amount)}</td>
                  <td className="table-cell text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_BADGE[o.status] ?? STATUS_BADGE.draft}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="table-cell text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {(orders ?? []).length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-sm text-gray-500">Manage performances, recitals, and showcases.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium">
          <Plus size={16} /> New Event
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="mb-3 skeleton h-5 w-40" />
              <div className="skeleton h-4 w-24" />
              <div className="mt-3 skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {/* Events grid */}
      {!isLoading && (events ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(events ?? []).map((evt, idx) => (
            <div
              key={evt.id}
              className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
            >
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-gray-900">{evt.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="inline-flex items-center gap-1"><Calendar size={12} /> {evt.event_date}</span>
                    {evt.event_time && <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatTime(evt.event_time)}</span>}
                    {evt.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {evt.location}</span>}
                  </div>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <DollarSign size={12} /> {formatCents(evt.ticket_price)}
                    </span>
                    <span className="inline-flex items-center gap-1 text-gray-500">
                      <Ticket size={12} /> {evt.tickets_sold}{evt.max_tickets ? `/${evt.max_tickets}` : ''} sold
                    </span>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${STATUS_BADGE[evt.status]}`}>
                  {evt.status}
                </span>
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-3">
                {evt.status === 'draft' && (
                  <button
                    onClick={() => updateMut.mutate({ id: evt.id, status: 'published' })}
                    className="icon-btn-success inline-flex items-center gap-1.5 px-3 text-xs font-medium"
                  >
                    <Eye size={13} /> Publish
                  </button>
                )}
                {evt.status === 'published' && (
                  <button
                    onClick={() => updateMut.mutate({ id: evt.id, status: 'completed' })}
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-blue-500/10 px-3 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-500/20"
                  >
                    Complete
                  </button>
                )}
                <button
                  onClick={() => { setSelectedEventId(evt.id); setView('orders'); }}
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-gray-100 px-3 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-200"
                >
                  <Users size={13} /> Orders
                </button>
                {evt.tickets_sold === 0 && (
                  <button
                    onClick={() => { if (confirm('Delete this event?')) deleteMut.mutate({ id: evt.id }); }}
                    className="icon-btn icon-btn-danger ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && (events ?? []).length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Ticket size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No events yet</p>
          <p className="mt-1 text-xs text-gray-400">Create your first performance or recital.</p>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <CreateEventModal
          onClose={() => setShowCreate(false)}
          onSubmit={(data) => createMut.mutate(data)}
          loading={createMut.isPending}
        />
      )}
    </div>
  );
}

function CreateEventModal({
  onClose,
  onSubmit,
  loading,
}: {
  onClose: () => void;
  onSubmit: (data: { name: string; event_date: string; event_time?: string; location?: string; ticket_price: number; max_tickets?: number; description?: string }) => void;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    name: '', event_date: '', event_time: '', location: '', ticket_price: '0', max_tickets: '', description: '',
  });

  return (
    <Modal open={true} onClose={onClose} title="New Event">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            name: form.name,
            event_date: form.event_date,
            event_time: form.event_time || undefined,
            location: form.location || undefined,
            ticket_price: Math.round(Number(form.ticket_price) * 100),
            max_tickets: form.max_tickets ? Number(form.max_tickets) : undefined,
            description: form.description || undefined,
          });
        }}
        className="space-y-4"
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Event Name *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Date *</label>
            <input type="date" value={form.event_date} onChange={(e) => setForm({ ...form, event_date: e.target.value })} required className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Time</label>
            <input type="time" value={form.event_time} onChange={(e) => setForm({ ...form, event_time: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Location</label>
          <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Ticket Price ($)</label>
            <input type="number" step="0.01" min="0" value={form.ticket_price} onChange={(e) => setForm({ ...form, ticket_price: e.target.value })} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Max Tickets</label>
            <input type="number" min="1" value={form.max_tickets} onChange={(e) => setForm({ ...form, max_tickets: e.target.value })} placeholder="Unlimited" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm input-glow" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">Description</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm input-glow" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-outline h-11 rounded-xl px-4 text-sm font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="btn-gradient h-11 rounded-xl px-5 text-sm font-medium disabled:opacity-50">
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
