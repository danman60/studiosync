'use client';

import { trpc } from '@/lib/trpc';
import { StudioProvider } from '@/contexts/StudioContext';

export function StudioResolver({ children }: { children: React.ReactNode }) {
  const { data: studio } = trpc.catalog.getStudio.useQuery(undefined, {
    retry: false,
  });

  return (
    <StudioProvider studio={studio ?? null} studioSlug={studio?.slug ?? null}>
      {children}
    </StudioProvider>
  );
}
