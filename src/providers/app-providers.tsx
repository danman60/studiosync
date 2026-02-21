'use client';

import { TRPCProvider } from './trpc-provider';
import { StudioProvider } from '@/contexts/StudioContext';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <StudioProvider studio={null} studioSlug={null}>
      <TRPCProvider>{children}</TRPCProvider>
    </StudioProvider>
  );
}
