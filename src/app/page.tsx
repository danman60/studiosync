import Link from 'next/link';
import { Layers, BookOpen, Users, CreditCard, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-sm">
              <Layers size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-stone-800">StudioSync</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link
              href="/classes"
              className="hidden h-10 items-center rounded-xl px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-primary-50 hover:text-primary sm:flex"
            >
              Browse Classes
            </Link>
            <Link
              href="/login"
              className="btn-gradient flex h-10 items-center rounded-xl px-5 text-sm font-medium"
            >
              Sign In
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="relative overflow-hidden px-6 py-20 sm:py-28">
          {/* Background decoration */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-primary-200/40 to-primary-200/30 blur-3xl" />
            <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-gradient-to-tr from-primary-200/30 to-primary-100/20 blur-3xl" />
          </div>

          <div className="relative mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-200/60 bg-primary-50/80 px-4 py-1.5 text-sm font-medium text-primary-dark backdrop-blur-sm animate-fade-in-up">
              <Sparkles size={14} />
              Part of the CompSync Ecosystem
            </div>

            <h1 className="font-display text-[clamp(2.25rem,5vw,3.5rem)] italic leading-[1.1] tracking-tight text-stone-800 animate-fade-in-up stagger-1">
              Modern Studio Management,{' '}
              <span className="text-primary">
                Simplified
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-stone-600 animate-fade-in-up stagger-2">
              Browse classes, register online, and manage your dance studio
              experience — all in one place. No account needed to start exploring.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4 animate-fade-in-up stagger-3">
              <Link
                href="/classes"
                className="btn-gradient flex h-12 items-center gap-2.5 rounded-xl px-7 text-sm font-semibold shadow-lg shadow-primary/15"
              >
                Browse Classes
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/login"
                className="flex h-12 items-center rounded-xl border border-stone-200 bg-white/80 px-7 text-sm font-semibold text-stone-700 backdrop-blur-sm transition-all hover:border-primary-200 hover:bg-primary-50/50 hover:text-primary-dark"
              >
                Parent Login
              </Link>
            </div>
          </div>
        </section>

        {/* Feature cards */}
        <section className="px-6 pb-24">
          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: 'Browse First',
                desc: 'Explore the full class catalog — no login required. Find the perfect class before creating an account.',
                gradient: 'from-primary/10 to-primary/5',
                iconBg: 'bg-primary-100 text-primary',
              },
              {
                icon: Users,
                title: 'Easy Registration',
                desc: 'Register your student in a few clicks. Magic link login — no passwords to remember.',
                gradient: 'from-emerald-500/10 to-emerald-600/5',
                iconBg: 'bg-emerald-100 text-emerald-600',
              },
              {
                icon: CreditCard,
                title: 'Simple Payments',
                desc: 'Secure online payments with Stripe. Set up auto-pay for monthly tuition and never miss a payment.',
                gradient: 'from-primary/10 to-primary/5',
                iconBg: 'bg-primary-100 text-primary',
              },
            ].map((card, i) => (
              <div
                key={card.title}
                className={`glass-card rounded-2xl p-6 animate-fade-in-up stagger-${i + 1}`}
              >
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ${card.iconBg}`}>
                  <card.icon size={20} />
                </div>
                <h3 className="text-base font-semibold text-stone-800">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-stone-100 bg-white/60 py-8 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <p className="text-sm text-stone-400">
            Powered by StudioSync — Part of the CompSync Ecosystem
          </p>
        </div>
      </footer>
    </div>
  );
}
