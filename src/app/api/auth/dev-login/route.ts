import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase-server';

const DEV_EMAIL = 'danieljohnabrahamson@gmail.com';
const DEV_PASSWORD = 'dev-studiosync-2024';

export async function POST() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Dev only' }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Find the existing auth user
  const { data: list } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = list?.users?.find((u) => u.email === DEV_EMAIL);

  if (!user) {
    // Create user if it doesn't exist
    const { error } = await supabase.auth.admin.createUser({
      email: DEV_EMAIL,
      password: DEV_PASSWORD,
      email_confirm: true,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  } else {
    // Ensure password is set on existing user
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password: DEV_PASSWORD,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ email: DEV_EMAIL, password: DEV_PASSWORD });
}
