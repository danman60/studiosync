'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { useStudio } from '@/contexts/StudioContext';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { studio } = useStudio();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar variant="admin" studioName={studio?.name} />
      <main className="lg:pl-64 transition-all duration-200">
        <div className="px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
