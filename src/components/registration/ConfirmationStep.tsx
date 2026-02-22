'use client';

import Link from 'next/link';
import { CheckCircle, Clock, Mail } from 'lucide-react';

interface Props {
  status: 'pending' | 'waitlisted';
  waitlistPosition: number | null;
  studentName: string;
  className: string;
}

export function ConfirmationStep({ status, waitlistPosition, studentName, className }: Props) {
  const isPending = status === 'pending';

  return (
    <div className="space-y-6 text-center animate-fade-in-up">
      {isPending ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200/60">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registration Confirmed!</h2>
            <p className="mt-2 text-gray-600">
              <span className="font-medium">{studentName}</span> has been registered for{' '}
              <span className="font-medium">{className}</span>.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-100 to-amber-200/60">
            <Clock size={32} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Added to Waitlist</h2>
            <p className="mt-2 text-gray-600">
              <span className="font-medium">{studentName}</span> is{' '}
              <span className="inline-flex items-center rounded-full bg-amber-500/15 px-2 py-0.5 text-sm font-semibold text-amber-700 border border-amber-500/25">
                #{waitlistPosition}
              </span>{' '}
              on the waitlist for <span className="font-medium">{className}</span>.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll notify you when a spot opens up.
            </p>
          </div>
        </>
      )}

      <div className="flex items-start gap-3 rounded-xl border border-blue-500/25 bg-blue-500/10 p-4 text-left text-sm text-blue-700">
        <Mail size={18} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-medium">Check your email</p>
          <p className="mt-0.5 text-blue-600">We sent a verification link to access your family portal.</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/classes"
          className="flex h-11 items-center justify-center rounded-xl border border-gray-200 bg-white px-6 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Register Another Student
        </Link>
        <Link
          href="/"
          className="btn-gradient flex h-11 items-center justify-center rounded-xl px-6 text-sm font-medium"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
