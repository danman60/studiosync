import type { Metadata } from 'next';
import { DM_Sans, Instrument_Serif } from 'next/font/google';
import { AppProviders } from '@/providers/app-providers';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-instrument',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'StudioSync — Studio Management',
  description: 'Modern dance studio management platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} ${instrumentSerif.variable} font-sans antialiased`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
