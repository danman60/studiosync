'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Layers, Mail, CheckCircle, Zap, Shield, GraduationCap, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase';

const IS_DEV = true;

type DevRole = 'owner' | 'instructor' | 'parent';

const DEV_BUTTONS: { role: DevRole; label: string; icon: typeof Zap; redirect: string; cookieRole: string; color: string }[] = [
  { role: 'owner', label: 'Owner / Admin', icon: Shield, redirect: '/admin', cookieRole: 'owner', color: 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100' },
  { role: 'instructor', label: 'Instructor', icon: GraduationCap, redirect: '/instructor', cookieRole: 'instructor', color: 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' },
  { role: 'parent', label: 'Parent', icon: Users, redirect: '/dashboard', cookieRole: 'parent', color: 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error' | 'dev-loading'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingRole, setLoadingRole] = useState<DevRole | null>(null);

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

  const handleDevLogin = async (btn: typeof DEV_BUTTONS[number]) => {
    setStatus('dev-loading');
    setLoadingRole(btn.role);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: btn.role }),
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) {
        throw new Error(body?.error ?? `Dev login failed (${res.status})`);
      }

      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: body.email,
        password: body.password,
      });
      if (error) throw new Error(error.message);

      document.cookie = `user-role=${btn.cookieRole}; path=/; max-age=2592000`;
      window.location.href = btn.redirect;
    } catch (err) {
      setStatus('error');
      setLoadingRole(null);
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

        {/* Dev quick-login buttons */}
        {IS_DEV && status !== 'sent' && (
          <div className="mt-5 space-y-2">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-stone-400">Dev Logins</p>
            <div className="grid grid-cols-3 gap-2">
              {DEV_BUTTONS.map((btn) => {
                const Icon = btn.icon;
                const isLoading = status === 'dev-loading' && loadingRole === btn.role;
                return (
                  <button
                    key={btn.role}
                    onClick={() => handleDevLogin(btn)}
                    disabled={status === 'dev-loading'}
                    className={`flex h-20 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed text-xs font-semibold transition-colors ${btn.color}`}
                  >
                    {isLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                    ) : (
                      <>
                        <Icon size={18} />
                        {btn.label}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
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
