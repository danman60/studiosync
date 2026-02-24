import { headers } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchClassDetail } from '@/lib/catalog-data';
import {
  ArrowLeft,
  Calendar,
  Clock,
  DollarSign,
  Layers,
  MapPin,
  Users,
} from 'lucide-react';
import { DAYS_OF_WEEK, formatTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function ClassDetailPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  const headersList = await headers();
  const studioSlug = headersList.get('x-studio-slug');
  const cls = await fetchClassDetail(classId, studioSlug);

  if (!cls) notFound();

  const spotsLeft = cls.capacity - cls.enrolled_count;
  const isFull = spotsLeft <= 0;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Layers size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-stone-800">StudioSync</span>
          </Link>
          <Link
            href="/login"
            className="btn-gradient flex h-10 items-center rounded-xl px-5 text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/classes"
          className="mb-6 inline-flex h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-stone-500 transition-colors hover:bg-primary-50 hover:text-primary animate-fade-in-up"
        >
          <ArrowLeft size={16} />
          Back to Classes
        </Link>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2">
            <div className="glass-card overflow-hidden rounded-2xl animate-fade-in-up stagger-1">
              {/* Color bar */}
              <div
                className="h-1.5"
                style={{
                  backgroundColor:
                    (cls.class_types as { color: string } | null)?.color ?? '#C2785C',
                }}
              />
              <div className="p-6">
                {/* Tags */}
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {cls.class_types && (
                    <span
                      className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium text-white"
                      style={{
                        backgroundColor: (cls.class_types as { color: string }).color,
                      }}
                    >
                      {(cls.class_types as { name: string }).name}
                    </span>
                  )}
                  {cls.levels && (
                    <span className="inline-flex items-center rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-700">
                      {(cls.levels as { name: string }).name}
                    </span>
                  )}
                </div>

                <h1 className="font-display text-[clamp(1.5rem,2.5vw,1.75rem)] italic text-stone-800">{cls.name}</h1>

                {cls.description && (
                  <p className="mt-3 text-base leading-relaxed text-stone-600">
                    {cls.description}
                  </p>
                )}

                {/* Details grid */}
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {[
                    { icon: Calendar, label: 'Schedule', value: `${DAYS_OF_WEEK[cls.day_of_week]}s` },
                    { icon: Clock, label: 'Time', value: `${formatTime(cls.start_time)} – ${formatTime(cls.end_time)}` },
                    ...(cls.room ? [{ icon: MapPin, label: 'Location', value: cls.room }] : []),
                    { icon: Users, label: 'Ages', value: `${cls.min_age ?? '?'} – ${cls.max_age ?? '?'} years` },
                  ].map((item) => (
                    <div key={item.label} className="flex items-start gap-3 rounded-xl bg-gradient-to-br from-stone-50 to-stone-100/50 p-4">
                      <item.icon size={18} className="mt-0.5 text-primary" />
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-stone-400">{item.label}</p>
                        <p className="mt-0.5 text-sm font-medium text-stone-800">{item.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Instructor */}
                {cls.staff && (
                  <div className="mt-6 text-sm text-stone-500">
                    Instructor:{' '}
                    <span className="font-medium text-stone-800">
                      {(cls.staff as { display_name: string }).display_name}
                    </span>
                  </div>
                )}

                {/* Season */}
                {cls.seasons && (
                  <div className="mt-2 text-sm text-stone-500">
                    Season:{' '}
                    <span className="font-medium text-stone-800">
                      {(cls.seasons as { name: string }).name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: pricing + CTA */}
          <div>
            <div className="sticky top-24 glass-card rounded-2xl p-6 animate-fade-in-up stagger-2">
              {/* Price */}
              {cls.monthly_price != null && (
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <DollarSign size={18} className="text-stone-400" />
                    <span className="text-3xl font-bold text-stone-800">
                      {cls.monthly_price}
                    </span>
                    <span className="text-sm text-stone-500">/month</span>
                  </div>
                  {cls.registration_fee != null && cls.registration_fee > 0 && (
                    <p className="mt-1 text-sm text-stone-500">
                      + ${cls.registration_fee} registration fee
                    </p>
                  )}
                </div>
              )}

              {/* Availability */}
              <div className="mb-6 flex items-center gap-2.5">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isFull
                      ? 'bg-red-500'
                      : spotsLeft <= 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />
                <span className="text-sm font-medium text-stone-700">
                  {isFull
                    ? 'Class is full'
                    : `${spotsLeft} of ${cls.capacity} spots available`}
                </span>
              </div>

              {/* CTA */}
              {isFull ? (
                <Link
                  href={`/register?class=${cls.id}`}
                  className="flex h-12 w-full items-center justify-center rounded-xl border border-primary-200 bg-primary-50/80 text-sm font-semibold text-primary-dark transition-colors hover:bg-primary-100"
                >
                  Join Waitlist
                </Link>
              ) : (
                <Link
                  href={`/register?class=${cls.id}`}
                  className="btn-gradient flex h-12 w-full items-center justify-center rounded-xl text-sm font-semibold shadow-lg shadow-primary/15"
                >
                  Register Now
                </Link>
              )}

              <p className="mt-3 text-center text-xs text-stone-400">
                No account needed to start registration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
