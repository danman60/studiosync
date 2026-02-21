import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createServiceClient } from '@/lib/supabase-server';

async function resolveRoleRedirect(
  supabase: SupabaseClient,
  userId: string,
  request: NextRequest
): Promise<string | null> {
  const hostname = request.headers.get('host') ?? '';
  const parts = hostname.split('.');
  let slug: string | null = null;
  if (parts.length >= 2) {
    const candidate = parts[0];
    if (!['www', 'app', 'api', 'studiosync', 'localhost'].includes(candidate!)) {
      slug = candidate!;
    }
  }
  if (!slug) return null;

  const { data: studio } = await supabase
    .from('studios')
    .select('id')
    .eq('slug', slug)
    .single();
  if (!studio) return null;

  const { data: staff } = await supabase
    .from('staff')
    .select('role')
    .eq('studio_id', studio.id)
    .eq('auth_user_id', userId)
    .eq('active', true)
    .single();

  if (staff?.role === 'owner' || staff?.role === 'admin') return '/admin';
  if (staff?.role === 'instructor') return '/instructor';
  return '/dashboard'; // family/parent default
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get('code');
  const familyId = searchParams.get('family');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // We need a server client with cookie handling to exchange the code.
  // Since this is a route handler, we use the service client to verify
  // and then link the family.
  const supabase = createServiceClient();

  // Exchange the code for a session using the auth admin API
  // Note: For magic links, the code exchange happens client-side via Supabase JS.
  // This callback route handles the redirect after the exchange.
  // The actual token exchange happens via the Supabase auth library.
  // For server-side exchange, we use verifyOtp with token_hash.
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as 'magiclink' | 'email' | undefined;

  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type === 'magiclink' ? 'magiclink' : 'email',
    });

    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=verification_failed`);
    }

    // Link family to auth user if familyId provided
    if (familyId && data.user) {
      await supabase
        .from('families')
        .update({ auth_user_id: data.user.id })
        .eq('id', familyId)
        .is('auth_user_id', null);
    }

    // Resolve role and set cookie for middleware route protection
    const roleRedirect = data.user ? await resolveRoleRedirect(supabase, data.user.id, request) : null;
    const roleName = roleRedirect === '/admin' ? 'admin' : roleRedirect === '/instructor' ? 'instructor' : 'parent';

    // Role-based redirect when no explicit next path was given
    const isDefaultNext = next === '/dashboard';
    const finalUrl = isDefaultNext && roleRedirect ? roleRedirect : next;

    const response = NextResponse.redirect(`${origin}${finalUrl}`);
    response.cookies.set('user-role', roleName, { path: '/', maxAge: 60 * 60 * 24 * 30 }); // 30 days
    return response;
  }

  // Fallback: PKCE code exchange flow
  // The code is typically exchanged client-side, but we handle the redirect
  if (familyId) {
    // Store family linking intent in the redirect
    return NextResponse.redirect(
      `${origin}${next}?link_family=${familyId}`
    );
  }

  return NextResponse.redirect(`${origin}${next}`);
}
