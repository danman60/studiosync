'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Mail, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
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

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-gray-50 px-6">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 top-1/4 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-200/30 to-purple-200/20 blur-3xl" />
        <div className="absolute -left-32 bottom-1/4 h-64 w-64 rounded-full bg-gradient-to-tr from-purple-200/20 to-indigo-100/20 blur-3xl" />
      </div>

      <Link href="/" className="relative mb-8 flex items-center gap-2.5 animate-fade-in-up">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-sm">
          <Layers size={20} className="text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">StudioSync</span>
      </Link>

      <div className="relative w-full max-w-sm glass-card rounded-2xl p-8 animate-fade-in-up stagger-1">
        <h1 className="text-[clamp(1.5rem,2.5vw,1.75rem)] font-bold text-gray-900">Sign In</h1>
        <p className="mt-2 text-sm text-gray-500">
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
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="block w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 transition-shadow placeholder:text-gray-400 input-glow"
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
              disabled={status === 'loading'}
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

        <p className="mt-6 text-center text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/classes" className="font-medium text-indigo-600 transition-colors hover:text-indigo-500">
            Browse classes
          </Link>{' '}
          to register.
        </p>
      </div>
    </div>
  );
}
