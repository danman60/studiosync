import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const DEV_PASSWORD = 'dev-studiosync-2024';
const STUDIO_ID = '11111111-1111-1111-1111-111111111111';

const DEV_ACCOUNTS: Record<string, { email: string; role: string; linkTable: 'staff' | 'families'; linkColumn: string; linkId: string }> = {
  owner: {
    email: 'danieljohnabrahamson@gmail.com',
    role: 'owner',
    linkTable: 'staff',
    linkColumn: 'auth_user_id',
    linkId: '8143f03b-b10a-4333-9d63-d7a3b673feb4',
  },
  instructor: {
    email: 'maria@demo.studiosync.net',
    role: 'instructor',
    linkTable: 'staff',
    linkColumn: 'auth_user_id',
    linkId: 'aaaaaaaa-0002-4000-8000-000000000002', // Maria Santos
  },
  parent: {
    email: 'jen@demo.studiosync.net',
    role: 'parent',
    linkTable: 'families',
    linkColumn: 'auth_user_id',
    linkId: 'ffffffff-0001-4000-8000-000000000001', // Jennifer Thompson
  },
};

export async function POST(request: Request) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return NextResponse.json(
        { error: 'Missing SUPABASE_SERVICE_ROLE_KEY env var on server' },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const requestedRole = (body.role as string) || 'owner';
    const account = DEV_ACCOUNTS[requestedRole];
    if (!account) {
      return NextResponse.json({ error: `Unknown role: ${requestedRole}` }, { status: 400 });
    }

    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
    const db = createClient(url, serviceKey, {
      db: { schema: 'studiosync' as 'public' },
      auth: { persistSession: false },
    });

    // Find or create auth user
    const { data: list, error: listErr } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) {
      return NextResponse.json({ error: `listUsers: ${listErr.message}` }, { status: 500 });
    }

    const existing = list?.users?.find((u) => u.email === account.email);
    let authUserId: string;

    if (!existing) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: account.email,
        password: DEV_PASSWORD,
        email_confirm: true,
      });
      if (error) {
        return NextResponse.json({ error: `createUser: ${error.message}` }, { status: 500 });
      }
      authUserId = data.user.id;
    } else {
      authUserId = existing.id;
      const { error } = await supabase.auth.admin.updateUserById(authUserId, {
        password: DEV_PASSWORD,
      });
      if (error) {
        return NextResponse.json({ error: `updateUser: ${error.message}` }, { status: 500 });
      }
    }

    // Link auth user to the staff/family record
    const { error: linkErr } = await db
      .from(account.linkTable)
      .update({ [account.linkColumn]: authUserId })
      .eq('id', account.linkId)
      .eq('studio_id', STUDIO_ID);

    if (linkErr) {
      return NextResponse.json({ error: `link ${account.linkTable}: ${linkErr.message}` }, { status: 500 });
    }

    return NextResponse.json({
      email: account.email,
      password: DEV_PASSWORD,
      role: account.role,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
