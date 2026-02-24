'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Mail, CheckCircle, Zap } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const IS_DEV = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEV_LOGIN === '1';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'dev-loading'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setStatus('error');
      setErrorMessage(error.message);
    } else {
      setStatus('sent');
    }
  };

  const handleDevLogin = async () => {
    setStatus('dev-loading');
    setErrorMessage('');

    try {
      // 1. Ensure dev user has a password
      const res = await fetch('/api/auth/dev-login', { method: 'POST' });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Dev login setup failed');
      }
      const { email: devEmail, password } = await res.json();

      // 2. Sign in with password (creates proper browser session)
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: devEmail,
        password,
      });
      if (error) throw new Error(error.message);

      // 3. Set role cookie and redirect to admin
      document.cookie = 'user-role=owner; path=/; max-age=2592000';
      window.location.href = '/admin';
    } catch (err) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Dev login failed');
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-6" style={{ backgroundColor: '#FAF9F7' }}>
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-primary-100/30 blur-3xl" />
        <div className="absolute -left-32 bottom-1/4 h-64 w-64 rounded-full bg-primary-100/20 blur-3xl" />
      </div>

      <Link href="/" className="relative mb-8 flex items-center gap-2.5 animate-fade-in-up">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-sm">
          <Layers size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-stone-800">StudioSync</span>
      </Link>

      <div className="relative w-full max-w-sm glass-card rounded-2xl p-8 animate-fade-in-up stagger-1">
        <h1 className="font-display text-[clamp(1.5rem,2.5vw,1.75rem)] italic text-stone-800">Sign In</h1>
        <p className="mt-2 text-sm text-stone-500">
          Enter your email to receive a magic sign-in link.
        </p>

        {status === 'sent' ? (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-700 animate-fade-in">
            <CheckCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Check your email</p>
              <p className="mt-1 text-emerald-600">We sent a sign-in link. You can close this page.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-stone-700">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={16} className="text-stone-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="block w-full rounded-xl border border-stone-200 bg-white py-2.5 pl-10 pr-3 text-sm text-stone-800 transition-shadow placeholder:text-stone-400 input-glow"
                />
              </div>
            </div>

            {status === 'error' && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                {errorMessage || 'Something went wrong. Please try again.'}
              </p>
            )}

            <button
              type="submit"
              disabled={status === 'loading' || status === 'dev-loading'}
              className="btn-gradient flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold"
            >
              {status === 'loading' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                'Send Magic Link'
              )}
            </button>
          </form>
        )}

        {/* Dev quick-login */}
        {IS_DEV && status !== 'sent' && (
          <button
            onClick={handleDevLogin}
            disabled={status === 'dev-loading'}
            className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-300 bg-amber-50 text-sm font-semibold text-amber-700 transition-colors hover:bg-amber-100"
          >
            {status === 'dev-loading' ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-600" />
            ) : (
              <>
                <Zap size={16} />
                Dev Login (Owner)
              </>
            )}
          </button>
        )}

        <p className="mt-6 text-center text-sm text-stone-500">
          Don&apos;t have an account?{' '}
          <Link href="/classes" className="font-medium text-primary transition-colors hover:text-primary-dark">
            Browse classes
          </Link>{' '}
          to register.
        </p>
      </div>
    </div>
  );
}
