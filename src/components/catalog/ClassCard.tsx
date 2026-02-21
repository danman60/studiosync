'use client';

import Link from 'next/link';
import { Clock, MapPin, Users } from 'lucide-react';
import { cn, DAYS_OF_WEEK, formatTime } from '@/lib/utils';

interface ClassCardProps {
  id: string;
  name: string;
  description: string | null;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  capacity: number;
  enrolledCount: number;
  monthlyPrice: number | null;
  minAge: number | null;
  maxAge: number | null;
  classType: { name: string; color: string } | null;
  level: { name: string } | null;
  instructor: { display_name: string } | null;
}

export function ClassCard({
  id,
  name,
  description,
  dayOfWeek,
  startTime,
  endTime,
  room,
  capacity,
  enrolledCount,
  monthlyPrice,
  minAge,
  maxAge,
  classType,
  level,
  instructor,
}: ClassCardProps) {
  const spotsLeft = capacity - enrolledCount;
  const isFull = spotsLeft <= 0;
  const isAlmostFull = spotsLeft > 0 && spotsLeft <= 3;

  return (
    <Link
      href={`/classes/${id}`}
      className="group block rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
    >
      {/* Color accent bar */}
      <div
        className="h-1.5 rounded-t-xl"
        style={{ backgroundColor: classType?.color ?? '#6366f1' }}
      />

      <div className="p-5">
        {/* Tags row */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {classType && (
            <span
              className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: classType.color }}
            >
              {classType.name}
            </span>
          )}
          {level && (
            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">
              {level.name}
            </span>
          )}
          {(minAge || maxAge) && (
            <span className="text-xs text-gray-500">
              Ages {minAge ?? '?'}–{maxAge ?? '?'}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-gray-900 group-hover:text-indigo-600">
          {name}
        </h3>

        {/* Description */}
        {description && (
          <p className="mt-1.5 line-clamp-2 text-sm text-gray-500">
            {description}
          </p>
        )}

        {/* Schedule row */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
          <span className="flex items-center gap-1.5">
            <Clock size={14} className="text-gray-400" />
            {DAYS_OF_WEEK[dayOfWeek]}s {formatTime(startTime)}–{formatTime(endTime)}
          </span>
          {room && (
            <span className="flex items-center gap-1.5">
              <MapPin size={14} className="text-gray-400" />
              {room}
            </span>
          )}
        </div>

        {/* Instructor */}
        {instructor && (
          <p className="mt-2 text-sm text-gray-500">
            with {instructor.display_name}
          </p>
        )}

        {/* Footer: price + availability */}
        <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
          {monthlyPrice != null ? (
            <span className="text-lg font-bold text-gray-900">
              ${monthlyPrice}
              <span className="text-sm font-normal text-gray-500">/mo</span>
            </span>
          ) : (
            <span className="text-sm text-gray-400">Price TBD</span>
          )}

          <span
            className={cn(
              'flex items-center gap-1.5 text-sm font-medium',
              isFull && 'text-red-600',
              isAlmostFull && 'text-amber-600',
              !isFull && !isAlmostFull && 'text-green-600'
            )}
          >
            <Users size={14} />
            {isFull
              ? 'Full'
              : isAlmostFull
                ? `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`
                : `${spotsLeft} spots open`}
          </span>
        </div>
      </div>
    </Link>
  );
}
