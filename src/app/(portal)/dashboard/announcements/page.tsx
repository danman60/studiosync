'use client';

import { trpc } from '@/lib/trpc';
import { Megaphone } from 'lucide-react';

export default function ParentAnnouncementsPage() {
  const { data: announcements, isLoading } = trpc.announcement.parentFeed.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Announcements</h1>
        <p className="mt-1 text-sm text-gray-500">News and updates from your studio.</p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-5">
              <div className="mb-2 skeleton h-5 w-48" />
              <div className="skeleton h-4 w-full" />
              <div className="mt-2 skeleton h-3 w-32" />
            </div>
          ))}
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
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                    <Megaphone size={16} className="text-indigo-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-gray-900">{ann.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">{ann.body}</p>
                    <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                      {author && <span>{author.display_name}</span>}
                      {ann.published_at && (
                        <>
                          <span>·</span>
                          <span>{new Date(ann.published_at).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && (announcements ?? []).length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Megaphone size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No announcements</p>
          <p className="mt-1 text-xs text-gray-400">Your studio has not posted any announcements yet.</p>
        </div>
      )}
    </div>
  );
}
