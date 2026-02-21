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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Layers size={24} className="text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">StudioSync</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Back link */}
        <Link
          href="/classes"
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={16} />
          Back to Classes
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main info */}
          <div className="lg:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              {/* Color bar */}
              <div
                className="h-2 rounded-t-xl"
                style={{
                  backgroundColor:
                    (cls.class_types as { color: string } | null)?.color ?? '#6366f1',
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
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {(cls.levels as { name: string }).name}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900">{cls.name}</h1>

                {cls.description && (
                  <p className="mt-3 text-base leading-relaxed text-gray-600">
                    {cls.description}
                  </p>
                )}

                {/* Details grid */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                    <Calendar size={20} className="mt-0.5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Schedule</p>
                      <p className="text-sm text-gray-600">
                        {DAYS_OF_WEEK[cls.day_of_week]}s
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                    <Clock size={20} className="mt-0.5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Time</p>
                      <p className="text-sm text-gray-600">
                        {formatTime(cls.start_time)} – {formatTime(cls.end_time)}
                      </p>
                    </div>
                  </div>
                  {cls.room && (
                    <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                      <MapPin size={20} className="mt-0.5 text-indigo-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Location</p>
                        <p className="text-sm text-gray-600">{cls.room}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3 rounded-lg bg-gray-50 p-4">
                    <Users size={20} className="mt-0.5 text-indigo-500" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ages</p>
                      <p className="text-sm text-gray-600">
                        {cls.min_age ?? '?'} – {cls.max_age ?? '?'} years
                      </p>
                    </div>
                  </div>
                </div>

                {/* Instructor */}
                {cls.staff && (
                  <div className="mt-6">
                    <p className="text-sm text-gray-500">
                      Instructor:{' '}
                      <span className="font-medium text-gray-900">
                        {(cls.staff as { display_name: string }).display_name}
                      </span>
                    </p>
                  </div>
                )}

                {/* Season */}
                {cls.seasons && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Season:{' '}
                      <span className="font-medium text-gray-900">
                        {(cls.seasons as { name: string }).name}
                      </span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar: pricing + CTA */}
          <div>
            <div className="sticky top-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              {/* Price */}
              {cls.monthly_price != null && (
                <div className="mb-4">
                  <div className="flex items-baseline gap-1">
                    <DollarSign size={18} className="text-gray-400" />
                    <span className="text-3xl font-bold text-gray-900">
                      {cls.monthly_price}
                    </span>
                    <span className="text-sm text-gray-500">/month</span>
                  </div>
                  {cls.registration_fee != null && cls.registration_fee > 0 && (
                    <p className="mt-1 text-sm text-gray-500">
                      + ${cls.registration_fee} registration fee
                    </p>
                  )}
                </div>
              )}

              {/* Availability */}
              <div className="mb-6 flex items-center gap-2">
                <div
                  className={`h-2.5 w-2.5 rounded-full ${
                    isFull
                      ? 'bg-red-500'
                      : spotsLeft <= 3
                        ? 'bg-amber-500'
                        : 'bg-green-500'
                  }`}
                />
                <span className="text-sm font-medium text-gray-700">
                  {isFull
                    ? 'Class is full'
                    : `${spotsLeft} of ${cls.capacity} spots available`}
                </span>
              </div>

              {/* CTA */}
              {isFull ? (
                <button className="w-full rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-100">
                  Join Waitlist
                </button>
              ) : (
                <Link
                  href={`/register?class=${cls.id}`}
                  className="block w-full rounded-lg bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                  Register Now
                </Link>
              )}

              <p className="mt-3 text-center text-xs text-gray-400">
                No account needed to start registration
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
