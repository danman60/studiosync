import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase-server';
import { sendNotification } from '@/lib/notifications';

/**
 * Cron job: Process scheduled messages that are due.
 * Runs every 5 minutes via Vercel Cron or external scheduler.
 *
 * POST /api/cron/send-scheduled
 * Requires CRON_SECRET header for authentication.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  // Get all due scheduled messages
  const { data: messages, error: msgError } = await supabase
    .from('scheduled_messages')
    .select('*')
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .limit(50);

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  if (!messages?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let totalSent = 0;

  for (const msg of messages) {
    try {
      // Resolve recipients based on targeting
      let families: { id: string; email: string; parent_first_name: string }[] = [];

      if (msg.target_type === 'all') {
        const { data } = await supabase
          .from('families')
          .select('id, email, parent_first_name')
          .eq('studio_id', msg.studio_id);
        families = data ?? [];
      } else if (msg.target_type === 'class' && msg.target_id) {
        const { data: enrollments } = await supabase
          .from('enrollments')
          .select('family_id')
          .eq('class_id', msg.target_id)
          .eq('studio_id', msg.studio_id)
          .in('status', ['active', 'pending']);

        const familyIds = [...new Set(enrollments?.map(e => e.family_id) ?? [])];
        if (familyIds.length > 0) {
          const { data } = await supabase
            .from('families')
            .select('id, email, parent_first_name')
            .eq('studio_id', msg.studio_id)
            .in('id', familyIds);
          families = data ?? [];
        }
      } else if (msg.target_type === 'tag' && msg.target_tag) {
        const { data: tagged } = await supabase
          .from('family_tags')
          .select('family_id')
          .eq('studio_id', msg.studio_id)
          .eq('tag', msg.target_tag);

        const familyIds = [...new Set(tagged?.map(t => t.family_id) ?? [])];
        if (familyIds.length > 0) {
          const { data } = await supabase
            .from('families')
            .select('id, email, parent_first_name')
            .eq('studio_id', msg.studio_id)
            .in('id', familyIds);
          families = data ?? [];
        }
      }

      // Send to each family
      for (const fam of families) {
        sendNotification({
          studioId: msg.studio_id,
          familyId: fam.id,
          type: 'custom',
          subject: msg.subject,
          body: msg.body,
          recipientEmail: fam.email,
        });
      }

      // Update message status
      await supabase
        .from('scheduled_messages')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          recipient_count: families.length,
        })
        .eq('id', msg.id)
        .eq('studio_id', msg.studio_id);

      totalSent++;
    } catch (err) {
      // Mark as failed
      await supabase
        .from('scheduled_messages')
        .update({
          status: 'failed',
          metadata: { error: err instanceof Error ? err.message : 'Unknown error' },
        })
        .eq('id', msg.id)
        .eq('studio_id', msg.studio_id);
    }
  }

  return NextResponse.json({
    processed: messages.length,
    sent: totalSent,
    failed: messages.length - totalSent,
  });
}
