'use client';

import { trpc } from '@/lib/trpc';
import {
  Image,
  Video,
  Music,
  FileText,
} from 'lucide-react';

const TYPE_ICON: Record<string, React.ReactNode> = {
  image: <Image size={18} className="text-primary" />,
  video: <Video size={18} className="text-primary" />,
  audio: <Music size={18} className="text-amber-500" />,
  document: <FileText size={18} className="text-stone-500" />,
};

export default function ParentMediaPage() {
  const { data: media, isLoading } = trpc.media.classMedia.useQuery();

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] italic text-stone-800">Class Media</h1>
        <p className="mt-1 text-sm text-stone-500">Photos, videos, and files shared by your classes.</p>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <div className="mb-3 skeleton h-36 w-full rounded-xl" />
              <div className="skeleton h-4 w-2/3" />
              <div className="mt-2 skeleton h-3 w-1/3" />
            </div>
          ))}
        </div>
      )}

      {/* Media grid */}
      {!isLoading && media && media.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {media.map((item, idx) => (
            <a
              key={item.id}
              href={item.url ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={`glass-card group rounded-2xl p-4 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              {/* Preview */}
              <div className="mb-3 flex h-36 items-center justify-center rounded-xl bg-gradient-to-br from-stone-50 to-stone-100 overflow-hidden">
                {item.type === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.title ?? item.file_name}
                    className="h-full w-full object-cover rounded-xl transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    {TYPE_ICON[item.type] ?? <FileText size={24} />}
                    <span className="text-xs">{item.type}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <p className="truncate text-sm font-medium text-stone-800">{item.title ?? item.file_name}</p>
              {item.classes && (
                <div className="mt-1.5 flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: (item.classes as { class_types: { color: string } }).class_types?.color ?? '#C2785C' }}
                  />
                  <span className="text-xs text-stone-500">
                    {(item.classes as { name: string }).name}
                  </span>
                </div>
              )}
              <p className="mt-1 text-xs text-stone-400">
                {new Date(item.created_at).toLocaleDateString()}
              </p>
            </a>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && media && media.length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50">
            <Image size={24} className="text-primary-light" />
          </div>
          <p className="text-sm font-medium text-stone-600">No media shared yet</p>
          <p className="mt-1 text-xs text-stone-400">When your instructors share photos or videos, they will appear here.</p>
        </div>
      )}
    </div>
  );
}
