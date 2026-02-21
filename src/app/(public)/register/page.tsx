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
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <Layers size={24} className="text-indigo-600" />
            <span className="text-lg font-bold text-gray-900">StudioSync</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Sign In
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Class Registration</h1>
        <RegistrationWizard classId={classId} />
      </div>
    </div>
  );
}
