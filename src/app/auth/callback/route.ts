import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

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

    return NextResponse.redirect(`${origin}${next}`);
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
