import { createClient } from '@supabase/supabase-js';
import { env } from './env';

export function createServiceClient() {
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    key,
    {
      db: { schema: 'studiosync' as 'public' },
      auth: { persistSession: false },
    }
  );
}
