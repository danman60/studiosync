import { headers } from 'next/headers';
import { fetchCatalogData } from '@/lib/catalog-data';
import { CatalogView } from '@/components/catalog/CatalogView';
import { Layers } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ClassesPage() {
  const headersList = await headers();
  const studioSlug = headersList.get('x-studio-slug');
  const data = await fetchCatalogData(studioSlug);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="glass-card rounded-2xl p-10 text-center animate-fade-in-up">
          <p className="text-stone-500">Studio not found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Layers size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-stone-800">
              {data.studio?.name ?? 'StudioSync'}
            </span>
          </Link>
          <Link
            href="/login"
            className="btn-gradient flex h-10 items-center rounded-xl px-5 text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-[clamp(1.75rem,3vw,2.25rem)] font-bold text-stone-800">
            {data.currentSeason?.name ?? 'Class'} Catalog
          </h1>
          <p className="mt-2 text-stone-600">
            Browse our classes and find the perfect fit. No account needed to explore.
          </p>
        </div>

        <CatalogView
          classes={data.classes}
          classTypes={data.classTypes}
          levels={data.levels}
        />
      </div>
    </div>
  );
}
