'use client';

import { createContext, useContext } from 'react';
import type { Studio } from '@/types/database';

interface StudioContextValue {
  studio: Studio | null;
  studioId: string | null;
  studioSlug: string | null;
}

const StudioContext = createContext<StudioContextValue>({
  studio: null,
  studioId: null,
  studioSlug: null,
});

export function StudioProvider({
  children,
  studio,
  studioSlug,
}: {
  children: React.ReactNode;
  studio: Studio | null;
  studioSlug: string | null;
}) {
  return (
    <StudioContext.Provider
      value={{
        studio,
        studioId: studio?.id ?? null,
        studioSlug,
      }}
    >
      {children}
    </StudioContext.Provider>
  );
}

export function useStudio() {
  return useContext(StudioContext);
}
