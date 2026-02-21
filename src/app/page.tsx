import Link from 'next/link';
import { Layers, BookOpen, Users, CreditCard, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <Layers size={28} className="text-indigo-600" />
            <span className="text-xl font-bold text-gray-900">StudioSync</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/classes"
              className="text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Browse Classes
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Modern Studio Management,{' '}
            <span className="text-indigo-600">Simplified</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Browse classes, register online, and manage your dance studio
            experience — all in one place. No account needed to start exploring.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/classes"
              className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
            >
              Browse Classes
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mx-auto mt-24 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <BookOpen size={20} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Browse First
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Explore the full class catalog — no login required. Find the
              perfect class before creating an account.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <Users size={20} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Easy Registration
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Register your child in a few clicks. Magic link login — no
              passwords to remember.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50">
              <CreditCard size={20} className="text-indigo-600" />
            </div>
            <h3 className="text-base font-semibold text-gray-900">
              Simple Payments
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Secure online payments with Stripe. Set up auto-pay for monthly
              tuition and never miss a payment.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-gray-400">
            Powered by StudioSync — Part of the CompSync Ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
}
