'use client';

import { X } from 'lucide-react';
import { cn, DAYS_OF_WEEK } from '@/lib/utils';

interface FilterOption {
  id: string;
  name: string;
  color?: string;
}

interface ClassFiltersProps {
  classTypes: FilterOption[];
  levels: FilterOption[];
  selectedTypeId: string | null;
  selectedLevelId: string | null;
  selectedDay: number | null;
  onTypeChange: (id: string | null) => void;
  onLevelChange: (id: string | null) => void;
  onDayChange: (day: number | null) => void;
  hasActiveFilters: boolean;
  onClearAll: () => void;
}

export function ClassFilters({
  classTypes,
  levels,
  selectedTypeId,
  selectedLevelId,
  selectedDay,
  onTypeChange,
  onLevelChange,
  onDayChange,
  hasActiveFilters,
  onClearAll,
}: ClassFiltersProps) {
  return (
    <div className="space-y-5">
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex h-7 items-center gap-1 rounded-lg px-2 text-xs font-medium text-indigo-600 transition-colors hover:bg-indigo-50"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Class Type */}
      <div>
        <h3 className="mb-2.5 text-sm font-medium text-gray-700">Style</h3>
        <div className="flex flex-wrap gap-2">
          {classTypes.map((type) => (
            <button
              key={type.id}
              onClick={() =>
                onTypeChange(selectedTypeId === type.id ? null : type.id)
              }
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium transition-all',
                selectedTypeId === type.id
                  ? 'text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
              )}
              style={
                selectedTypeId === type.id
                  ? { backgroundColor: type.color ?? '#6366f1' }
                  : undefined
              }
            >
              {type.name}
            </button>
          ))}
        </div>
      </div>

      {/* Level */}
      <div>
        <h3 className="mb-2.5 text-sm font-medium text-gray-700">Level</h3>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() =>
                onLevelChange(selectedLevelId === level.id ? null : level.id)
              }
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium transition-all',
                selectedLevelId === level.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
              )}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* Day of Week */}
      <div>
        <h3 className="mb-2.5 text-sm font-medium text-gray-700">Day</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day, i) => (
            <button
              key={day}
              onClick={() => onDayChange(selectedDay === i ? null : i)}
              className={cn(
                'h-8 rounded-full px-3 text-xs font-medium transition-all',
                selectedDay === i
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/50'
              )}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
