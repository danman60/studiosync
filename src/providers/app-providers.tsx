'use client';

import { TRPCProvider } from './trpc-provider';
import { StudioResolver } from './studio-resolver';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <StudioResolver>{children}</StudioResolver>
    </TRPCProvider>
  );
}
