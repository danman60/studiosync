import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase-server';

/**
 * Cron job: Process overdue invoices and apply late fees.
 * Runs daily via Vercel Cron or external scheduler.
 *
 * POST /api/cron/late-fees
 * Requires CRON_SECRET header for authentication.
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  const cronSecret = env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();
  const today = new Date().toISOString().slice(0, 10);

  // Get all studios with active invoices
  const { data: studios } = await supabase
    .from('studios')
    .select('id, settings');

  if (!studios?.length) {
    return NextResponse.json({ processed: 0 });
  }

  let totalMarked = 0;
  let totalFees = 0;

  for (const studio of studios) {
    const settings = (studio.settings ?? {}) as Record<string, unknown>;
    const lateFeeAmount = Number(settings.late_fee_amount ?? 0);
    const lateFeeType = String(settings.late_fee_type ?? 'flat');

    // 1. Mark overdue
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, total, late_fee_applied_at')
      .eq('studio_id', studio.id)
      .in('status', ['sent', 'partial'])
      .lt('due_date', today);

    if (!overdueInvoices?.length) continue;

    await supabase
      .from('invoices')
      .update({ status: 'overdue' })
      .eq('studio_id', studio.id)
      .in('status', ['sent', 'partial'])
      .lt('due_date', today);

    totalMarked += overdueInvoices.length;

    // 2. Apply late fees if configured
    if (lateFeeAmount > 0) {
      for (const inv of overdueInvoices) {
        if (inv.late_fee_applied_at) continue;

        let fee = 0;
        if (lateFeeType === 'percent') {
          fee = Math.round(inv.total * (lateFeeAmount / 10000));
        } else {
          fee = lateFeeAmount;
        }

        if (fee > 0) {
          await supabase
            .from('invoice_line_items')
            .insert({
              invoice_id: inv.id,
              studio_id: studio.id,
              description: 'Late Fee',
              quantity: 1,
              unit_price: fee,
              total: fee,
            });

          await supabase
            .from('invoices')
            .update({
              late_fee_amount: fee,
              late_fee_applied_at: new Date().toISOString(),
              subtotal: inv.total + fee,
              total: inv.total + fee,
            })
            .eq('id', inv.id)
            .eq('studio_id', studio.id);

          totalFees++;
        }
      }
    }
  }

  return NextResponse.json({
    processed: studios.length,
    markedOverdue: totalMarked,
    feesApplied: totalFees,
  });
}
