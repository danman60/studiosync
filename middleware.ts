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
