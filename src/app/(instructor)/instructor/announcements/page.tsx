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
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">Studio announcements relevant to your classes.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-gray-200/60 bg-white/80 p-5">
              <div className="mb-2 h-5 w-48 rounded bg-gray-200/60" />
              <div className="h-4 w-full rounded bg-gray-200/40" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && (announcements ?? []).length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-white/60 py-20">
          <Megaphone size={24} className="mb-3 text-indigo-400" />
          <p className="text-sm font-medium text-gray-600">No announcements</p>
          <p className="mt-1 text-xs text-gray-400">Studio announcements will appear here.</p>
        </div>
      )}

      {!isLoading && (announcements ?? []).length > 0 && (
        <div className="space-y-3">
          {(announcements ?? []).map((ann, idx) => {
            const author = ann.staff as unknown as { display_name: string } | null;
            return (
              <div
                key={ann.id}
                className="rounded-2xl border border-gray-200/60 bg-white/80 backdrop-blur-sm p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
                style={{ animationDelay: `${idx * 40}ms` }}
              >
                <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                <p className="mt-1 text-sm text-gray-600 line-clamp-3">{ann.body}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
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
