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
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Studio not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Layers size={24} className="text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">
              {data.studio?.name ?? 'StudioSync'}
            </span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Page header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {data.currentSeason?.name ?? 'Class'} Catalog
          </h1>
          <p className="mt-2 text-gray-600">
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
