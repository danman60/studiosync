'use client';

import { trpc } from '@/lib/trpc';
import { Megaphone, Globe, BookOpen } from 'lucide-react';

const TARGET_ICON: Record<string, React.ReactNode> = {
  all: <Globe size={12} />,
  class: <BookOpen size={12} />,
};

export default function InstructorAnnouncementsPage() {
  const { data: announcements, isLoading } = trpc.announcement.instructorFeed.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Announcements</h1>
        <p className="mt-1 text-sm text-stone-500">Studio announcements relevant to your classes.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="mb-2 skeleton h-5 w-48" />
              <div className="skeleton h-4 w-full" />
              <div className="mt-2 skeleton h-3 w-32" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (announcements ?? []).length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Megaphone size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No announcements</p>
          <p className="mt-1 text-xs text-stone-400">Studio announcements will appear here.</p>
        </div>
      )}

      {!isLoading && (announcements ?? []).length > 0 && (
        <div className="space-y-3">
          {(announcements ?? []).map((ann, idx) => {
            const author = ann.staff as unknown as { display_name: string } | null;
            return (
              <div
                key={ann.id}
                className={`glass-card rounded-2xl p-5 animate-fade-in-up stagger-${Math.min(idx + 1, 8)}`}
              >
                <h3 className="text-sm font-semibold text-stone-800">{ann.title}</h3>
                <p className="mt-1 text-sm text-stone-600 line-clamp-3">{ann.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-stone-400">
                  <span className="inline-flex items-center gap-1">
                    {TARGET_ICON[ann.target_type] ?? TARGET_ICON.all}
                    {ann.target_type === 'all' ? 'Everyone' : ann.target_type.replace('_', ' ')}
                  </span>
                  {author && <span>by {author.display_name}</span>}
                  <span>{ann.published_at ? new Date(ann.published_at).toLocaleDateString() : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
