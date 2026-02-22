'use client';

import { useState, useRef } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Image,
  Video,
  Music,
  FileText,
  Upload,
  Trash2,
  Eye,
  EyeOff,
  Filter,
} from 'lucide-react';

const TYPE_ICON: Record<string, React.ReactNode> = {
  image: <Image size={18} className="text-indigo-500" />,
  video: <Video size={18} className="text-purple-500" />,
  audio: <Music size={18} className="text-amber-500" />,
  document: <FileText size={18} className="text-gray-500" />,
};

const TYPE_BADGE: Record<string, string> = {
  image: 'bg-indigo-500/15 text-indigo-600 border border-indigo-500/25',
  video: 'bg-purple-500/15 text-purple-600 border border-purple-500/25',
  audio: 'bg-amber-500/15 text-amber-600 border border-amber-500/25',
  document: 'bg-gray-500/15 text-gray-600 border border-gray-500/20',
};

function formatFileSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MediaPage() {
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: media, isLoading } = trpc.media.list.useQuery(
    typeFilter ? { type: typeFilter as 'image' | 'video' | 'audio' | 'document' } : undefined
  );
  const getUploadUrl = trpc.media.getUploadUrl.useMutation();
  const confirmUpload = trpc.media.confirmUpload.useMutation();
  const deleteMutation = trpc.media.delete.useMutation({
    onSuccess: () => utils.media.list.invalidate(),
  });
  const togglePublic = trpc.media.togglePublic.useMutation({
    onSuccess: () => utils.media.list.invalidate(),
  });

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const { uploadUrl, token, media: mediaRecord } = await getUploadUrl.mutateAsync({
        fileName: file.name,
        mimeType: file.type,
      });

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'x-upsert': 'true',
          ...(token ? { 'x-token': token } : {}),
        },
        body: file,
      });

      if (!res.ok) throw new Error('Upload failed');

      await confirmUpload.mutateAsync({
        mediaId: mediaRecord.id,
        fileSize: file.size,
      });

      utils.media.list.invalidate();
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[clamp(1.5rem,2.5vw,2rem)] font-bold text-gray-900">Media Library</h1>
          <p className="mt-1 text-sm text-gray-500">Upload and manage photos, videos, and documents.</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="btn-gradient inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-medium disabled:opacity-50"
          >
            <Upload size={16} />
            {uploading ? 'Uploading...' : 'Upload File'}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {['', 'image', 'video', 'audio', 'document'].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`filter-chip ${typeFilter === t ? 'filter-chip-active' : ''}`}
          >
            {t === '' ? <Filter size={14} /> : TYPE_ICON[t]}
            {t === '' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="glass-card rounded-2xl p-4">
              <div className="mb-3 skeleton h-32 w-full rounded-xl" />
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
            <div
              key={item.id}
              className={`glass-card group relative rounded-2xl p-4 animate-fade-in-up stagger-${Math.min(idx + 1, 6)}`}
            >
              {/* Preview */}
              <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                {item.type === 'image' && item.url ? (
                  <img
                    src={item.url}
                    alt={item.title ?? item.file_name}
                    className="h-full w-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    {TYPE_ICON[item.type] ?? <FileText size={24} />}
                    <span className="text-xs">{item.type}</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.title ?? item.file_name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${TYPE_BADGE[item.type]}`}>
                      {item.type}
                    </span>
                    <span className="text-xs text-gray-400">{formatFileSize(item.file_size)}</span>
                  </div>
                  {item.classes && (
                    <p className="mt-1 truncate text-xs text-gray-400">
                      {(item.classes as { name: string }).name}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={() => togglePublic.mutate({ id: item.id, isPublic: !item.is_public })}
                    className="icon-btn"
                    title={item.is_public ? 'Make private' : 'Make public'}
                  >
                    {item.is_public ? <Eye size={15} /> : <EyeOff size={15} />}
                  </button>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="icon-btn"
                      title="Open"
                    >
                      <Eye size={15} />
                    </a>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('Delete this file?')) {
                        deleteMutation.mutate({ id: item.id });
                      }
                    }}
                    className="icon-btn icon-btn-danger"
                    title="Delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {/* Public badge */}
              {item.is_public && (
                <div className="absolute right-3 top-3 rounded-full bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  Public
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && media && media.length === 0 && (
        <div className="empty-state">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50">
            <Image size={24} className="text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">No media files yet</p>
          <p className="mt-1 text-xs text-gray-400">Upload photos, videos, or documents to get started.</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="btn-gradient mt-4 inline-flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-medium"
          >
            <Upload size={14} /> Upload First File
          </button>
        </div>
      )}
    </div>
  );
}
