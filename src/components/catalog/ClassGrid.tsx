'use client';

import { ClassCard } from './ClassCard';
import { BookOpen } from 'lucide-react';

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
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(i + 1, 4)}`}
          >
            <div className="skeleton h-1.5 w-full rounded-full mb-4" />
            <div className="flex gap-2 mb-3">
              <div className="skeleton h-5 w-16 rounded-full" />
              <div className="skeleton h-5 w-12 rounded-full" />
            </div>
            <div className="skeleton h-5 w-3/4 mb-2" />
            <div className="skeleton h-4 w-full mb-1" />
            <div className="skeleton h-4 w-2/3 mb-4" />
            <div className="skeleton h-4 w-40 mb-4" />
            <div className="border-t border-gray-100 pt-4 flex justify-between">
              <div className="skeleton h-6 w-16" />
              <div className="skeleton h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (classes.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center rounded-2xl py-16 text-center animate-fade-in-up">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
          <BookOpen size={24} className="text-indigo-600" />
        </div>
        <p className="mt-4 text-lg font-medium text-gray-900">No classes found</p>
        <p className="mt-1 text-sm text-gray-500">
          Try adjusting your filters to see more results.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
      {classes.map((cls, i) => (
        <div key={cls.id} className={`animate-fade-in-up stagger-${Math.min(i + 1, 4)}`}>
          <ClassCard
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
        </div>
      ))}
    </div>
  );
}
