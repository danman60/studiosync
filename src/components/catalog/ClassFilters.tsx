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
    <div className="space-y-4">
      {/* Filter header */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {/* Class Type */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">Style</h3>
        <div className="flex flex-wrap gap-2">
          {classTypes.map((type) => (
            <button
              key={type.id}
              onClick={() =>
                onTypeChange(selectedTypeId === type.id ? null : type.id)
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selectedTypeId === type.id
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
        <h3 className="mb-2 text-sm font-medium text-gray-700">Level</h3>
        <div className="flex flex-wrap gap-2">
          {levels.map((level) => (
            <button
              key={level.id}
              onClick={() =>
                onLevelChange(selectedLevelId === level.id ? null : level.id)
              }
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selectedLevelId === level.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {level.name}
            </button>
          ))}
        </div>
      </div>

      {/* Day of Week */}
      <div>
        <h3 className="mb-2 text-sm font-medium text-gray-700">Day</h3>
        <div className="flex flex-wrap gap-2">
          {DAYS_OF_WEEK.map((day, i) => (
            <button
              key={day}
              onClick={() => onDayChange(selectedDay === i ? null : i)}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                selectedDay === i
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
