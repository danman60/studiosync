'use client';

import Link from 'next/link';
import { CheckCircle, Clock } from 'lucide-react';

interface Props {
  status: 'pending' | 'waitlisted';
  waitlistPosition: number | null;
  childName: string;
  className: string;
}

export function ConfirmationStep({ status, waitlistPosition, childName, className }: Props) {
  const isPending = status === 'pending';

  return (
    <div className="space-y-6 text-center">
      {isPending ? (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle size={32} className="text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Registration Confirmed!</h2>
            <p className="mt-2 text-gray-600">
              <span className="font-medium">{childName}</span> has been registered for{' '}
              <span className="font-medium">{className}</span>.
            </p>
          </div>
        </>
      ) : (
        <>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
            <Clock size={32} className="text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Added to Waitlist</h2>
            <p className="mt-2 text-gray-600">
              <span className="font-medium">{childName}</span> is{' '}
              <span className="font-semibold text-amber-700">#{waitlistPosition}</span> on the
              waitlist for <span className="font-medium">{className}</span>.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              We&apos;ll notify you when a spot opens up.
            </p>
          </div>
        </>
      )}

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        Check your email for a verification link to access your family portal.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/classes"
          className="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
        >
          Register Another Child
        </Link>
        <Link
          href="/"
          className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
