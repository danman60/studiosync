'use client';

import { useMemo, useState } from 'react';
import { ClassFilters } from './ClassFilters';
import { ClassGrid } from './ClassGrid';
import { SlidersHorizontal, X } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  class_type_id: string;
  level_id: string | null;
  class_types: { name: string; color: string } | null;
  levels: { name: string } | null;
  staff: { display_name: string } | null;
}

interface FilterOption {
  id: string;
  name: string;
  color?: string;
}

interface CatalogViewProps {
  classes: ClassData[];
  classTypes: FilterOption[];
  levels: FilterOption[];
}

export function CatalogView({ classes, classTypes, levels }: CatalogViewProps) {
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const hasActiveFilters =
    selectedTypeId !== null || selectedLevelId !== null || selectedDay !== null;

  const filteredClasses = useMemo(() => {
    return classes.filter((cls) => {
      if (selectedTypeId && cls.class_type_id !== selectedTypeId) return false;
      if (selectedLevelId && cls.level_id !== selectedLevelId) return false;
      if (selectedDay !== null && cls.day_of_week !== selectedDay) return false;
      return true;
    });
  }, [classes, selectedTypeId, selectedLevelId, selectedDay]);

  const clearAll = () => {
    setSelectedTypeId(null);
    setSelectedLevelId(null);
    setSelectedDay(null);
  };

  return (
    <div className="flex gap-8">
      {/* Desktop sidebar filters */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 glass-card rounded-2xl p-5 animate-fade-in-up">
          <ClassFilters
            classTypes={classTypes}
            levels={levels}
            selectedTypeId={selectedTypeId}
            selectedLevelId={selectedLevelId}
            selectedDay={selectedDay}
            onTypeChange={setSelectedTypeId}
            onLevelChange={setSelectedLevelId}
            onDayChange={setSelectedDay}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAll}
          />
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {/* Mobile filter toggle + result count */}
        <div className="mb-4 flex items-center justify-between animate-fade-in-up">
          <p className="text-sm text-stone-600">
            {filteredClasses.length} class{filteredClasses.length !== 1 ? 'es' : ''}
            {hasActiveFilters ? ' (filtered)' : ''}
          </p>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white/80 px-4 text-sm font-medium text-stone-700 backdrop-blur-sm transition-colors hover:border-primary-200 hover:bg-primary-50/50 lg:hidden"
          >
            <SlidersHorizontal size={16} />
            Filters
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                !
              </span>
            )}
          </button>
        </div>

        <ClassGrid classes={filteredClasses} />
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] lg:hidden"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div
            className={cn(
              'fixed inset-y-0 right-0 z-50 w-80 bg-white/95 backdrop-blur-md p-6 shadow-xl lg:hidden',
              'overflow-y-auto'
            )}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-stone-800">Filters</h2>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
              >
                <X size={20} />
              </button>
            </div>
            <ClassFilters
              classTypes={classTypes}
              levels={levels}
              selectedTypeId={selectedTypeId}
              selectedLevelId={selectedLevelId}
              selectedDay={selectedDay}
              onTypeChange={(id) => {
                setSelectedTypeId(id);
              }}
              onLevelChange={(id) => {
                setSelectedLevelId(id);
              }}
              onDayChange={(day) => {
                setSelectedDay(day);
              }}
              hasActiveFilters={hasActiveFilters}
              onClearAll={clearAll}
            />
          </div>
        </>
      )}
    </div>
  );
}
