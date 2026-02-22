'use client';

import { trpc } from '@/lib/trpc';
import { Award, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function InstructorProgressOverviewPage() {
  const { data: classes, isLoading } = trpc.instructor.myClasses.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Progress</h1>
        <p className="mt-1 text-sm text-gray-500">Select a class to view and manage student progress marks.</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="mb-3 skeleton h-5 w-40" />
              <div className="skeleton h-4 w-24" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (classes ?? []).length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Award size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No classes assigned</p>
          <p className="mt-1 text-xs text-gray-400">Progress marking will be available once you have classes.</p>
        </div>
      )}

      {!isLoading && (classes ?? []).length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(classes ?? []).map((cls, idx) => {
            const ct = cls.class_types as unknown as { name: string; color: string } | null;
            return (
              <Link
                key={cls.id}
                href={`/instructor/classes/${cls.id}/progress`}
                className={`glass-card group rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <BookOpen size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {cls.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {ct && (
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{ backgroundColor: `${ct.color}20`, color: ct.color, border: `1px solid ${ct.color}30` }}
                        >
                          {ct.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Award size={16} className="shrink-0 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
