'use client';

import { createContext, useContext } from 'react';

/** Minimal studio shape needed by the UI (subset of full Studio row) */
export interface StudioInfo {
  id: string;
  name: string;
  slug: string;
  logo_url?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

interface StudioContextValue {
  studio: StudioInfo | null;
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
  studio: StudioInfo | null;
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
