'use client';

import { Sidebar } from '@/components/ui/sidebar';
import { useStudio } from '@/contexts/StudioContext';

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { studio } = useStudio();

  return (
    <div className="min-h-screen bg-stone-50/50">
      <Sidebar variant="instructor" studioName={studio?.name} />
      <main className="lg:pl-64 transition-all duration-200">
        <div className="px-6 py-8">{children}</div>
      </main>
    </div>
  );
}
