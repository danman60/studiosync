import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Layers } from 'lucide-react';
import { RegistrationWizard } from '@/components/registration/RegistrationWizard';

export const dynamic = 'force-dynamic';

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ class?: string }>;
}) {
  const params = await searchParams;
  const classId = params.class;

  if (!classId) {
    redirect('/classes');
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Layers size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-stone-800">StudioSync</span>
          </Link>
          <Link
            href="/login"
            className="btn-gradient flex h-10 items-center rounded-xl px-5 text-sm font-medium"
          >
            Sign In
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 font-display text-[clamp(1.5rem,2.5vw,1.75rem)] italic text-stone-800 animate-fade-in-up">
          Class Registration
        </h1>
        <RegistrationWizard classId={classId} />
      </div>
    </div>
  );
}
