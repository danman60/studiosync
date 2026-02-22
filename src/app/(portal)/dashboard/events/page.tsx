'use client';

import { trpc } from '@/lib/trpc';
import { Calendar, Clock, MapPin, Ticket } from 'lucide-react';

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

export default function ParentEventsPage() {
  const { data: events, isLoading } = trpc.event.published.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Upcoming Events</h1>
        <p className="mt-1 text-sm text-gray-500">Performances, recitals, and showcases from your studio.</p>
      </div>

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

      {!isLoading && (events ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(events ?? []).map((evt, idx) => {
            const available = evt.max_tickets ? evt.max_tickets - evt.tickets_sold : null;
            const soldOut = available !== null && available <= 0;

            return (
              <div
                key={evt.id}
                className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
              >
                <h3 className="text-base font-semibold text-gray-900">{evt.name}</h3>
                {evt.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">{evt.description}</p>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1"><Calendar size={12} /> {evt.event_date}</span>
                  {evt.event_time && <span className="inline-flex items-center gap-1"><Clock size={12} /> {formatTime(evt.event_time)}</span>}
                  {evt.location && <span className="inline-flex items-center gap-1"><MapPin size={12} /> {evt.location}</span>}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3">
                  <span className="text-sm font-semibold text-gray-900">{formatCents(evt.ticket_price)}</span>
                  {soldOut ? (
                    <span className="rounded-full bg-red-500/15 border border-red-500/25 px-3 py-1 text-[11px] font-medium text-red-600">Sold Out</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {available !== null && (
                        <span className="text-xs text-gray-400">{available} left</span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-3 py-1 text-[11px] font-medium text-indigo-600">
                        <Ticket size={12} /> Available
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (events ?? []).length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Calendar size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No upcoming events</p>
          <p className="mt-1 text-xs text-gray-400">Check back later for performances and recitals.</p>
        </div>
      )}
    </div>
  );
}
