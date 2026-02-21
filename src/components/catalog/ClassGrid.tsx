'use client';

import { ClassCard } from './ClassCard';

interface ClassData {
  id: string;
  name: string;
  description: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  capacity: number;
  enrolled_count: number;
  monthly_price: number | null;
  min_age: number | null;
  max_age: number | null;
  class_types: { name: string; color: string } | null;
  levels: { name: string } | null;
  staff: { display_name: string } | null;
}

interface ClassGridProps {
  classes: ClassData[];
  isLoading?: boolean;
}

export function ClassGrid({ classes, isLoading }: ClassGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white py-16 text-center">
        <p className="text-lg font-medium text-gray-900">No classes found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((cls) => (
        <ClassCard
          key={cls.id}
          id={cls.id}
          name={cls.name}
          description={cls.description}
          dayOfWeek={cls.day_of_week}
          startTime={cls.start_time}
          endTime={cls.end_time}
          room={cls.room}
          capacity={cls.capacity}
          enrolledCount={cls.enrolled_count}
          monthlyPrice={cls.monthly_price}
          minAge={cls.min_age}
          maxAge={cls.max_age}
          classType={cls.class_types}
          level={cls.levels}
          instructor={cls.staff}
        />
      ))}
    </div>
  );
}
