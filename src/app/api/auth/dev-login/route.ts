import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEV_EMAIL = 'danieljohnabrahamson@gmail.com';
const DEV_PASSWORD = 'dev-studiosync-2024';

export async function POST() {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var on server' },
        { status: 500 }
      );
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Find the existing auth user
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: `listUsers: ${listErr.message}` }, { status: 500 });
    }

    const user = list?.users?.find((u) => u.email === DEV_EMAIL);

    if (!user) {
      const { error } = await supabase.auth.admin.createUser({
        email: DEV_EMAIL,
        password: DEV_PASSWORD,
        email_confirm: true,
      });
      if (error) {
        return NextResponse.json({ error: `createUser: ${error.message}` }, { status: 500 });
      }
    } else {
      const { error } = await supabase.auth.admin.updateUserById(user.id, {
        password: DEV_PASSWORD,
      });
      if (error) {
        return NextResponse.json({ error: `updateUser: ${error.message}` }, { status: 500 });
      }
    }

    return NextResponse.json({ email: DEV_EMAIL, password: DEV_PASSWORD });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
