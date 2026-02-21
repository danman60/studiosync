import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? '';

  // Extract subdomain: {slug}.studiosync.net or {slug}.localhost:3000
  const parts = hostname.split('.');
  let slug: string | null = null;
  if (parts.length >= 2) {
    const candidate = parts[0];
    if (!['www', 'app', 'api', 'studiosync', 'localhost'].includes(candidate)) {
      slug = candidate;
    }
  }

  // Set request headers so route handlers can read x-studio-slug
  const requestHeaders = new Headers(request.headers);
  if (slug) {
    requestHeaders.set('x-studio-slug', slug);
  }

  // Protect authenticated routes — redirect to login if no auth cookie
  const { pathname } = request.nextUrl;
  const protectedPaths = ['/instructor', '/admin', '/dashboard'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected) {
    // Check for Supabase auth cookie (sb-*-auth-token)
    const hasAuthCookie = Array.from(request.cookies.getAll()).some(
      (c) => c.name.includes('-auth-token') || c.name.includes('sb-')
    );
    if (!hasAuthCookie) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection via cookie hint
    // The `user-role` cookie is set by the auth callback after login.
    // This prevents parents from accessing /admin or /instructor and vice versa.
    // tRPC procedures are the authoritative enforcement layer — this is a UX guard.
    const userRole = request.cookies.get('user-role')?.value;
    if (userRole) {
      if (pathname.startsWith('/admin') && !['owner', 'admin'].includes(userRole)) {
        return NextResponse.redirect(new URL(userRole === 'instructor' ? '/instructor' : '/dashboard', request.url));
      }
      if (pathname.startsWith('/instructor') && !['owner', 'admin', 'instructor'].includes(userRole)) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      if (pathname.startsWith('/dashboard') && ['owner', 'admin'].includes(userRole)) {
        // Allow admins to view parent portal if they choose, don't redirect
      }
    }
  }

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // Also set cookie for client-side reads
  if (slug) {
    response.cookies.set('studio-slug', slug, { path: '/' });
  } else {
    response.cookies.delete('studio-slug');
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
