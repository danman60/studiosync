import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { env } from '@/lib/env';
import { createServiceClient } from '@/lib/supabase-server';
import type Stripe from 'stripe';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig || !env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Stripe webhook signature verification failed:', message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createServiceClient();

  switch (event.type) {
    // ── One-time invoice payments ──────────────────────────
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      const studioId = pi.metadata?.studio_id;

      if (invoiceId && studioId) {
        const { data: invoice } = await supabase
          .from('invoices')
          .select('id, total, amount_paid')
          .eq('id', invoiceId)
          .eq('studio_id', studioId)
          .single();

        if (invoice) {
          const newAmountPaid = invoice.amount_paid + pi.amount;
          const fullyPaid = newAmountPaid >= invoice.total;

          await supabase
            .from('invoices')
            .update({
              amount_paid: newAmountPaid,
              status: fullyPaid ? 'paid' : 'partial',
              paid_at: fullyPaid ? new Date().toISOString() : null,
            })
            .eq('id', invoiceId)
            .eq('studio_id', studioId);

          await supabase
            .from('payments')
            .insert({
              studio_id: studioId,
              family_id: pi.metadata?.family_id ?? '',
              stripe_payment_intent_id: pi.id,
              amount: pi.amount,
              type: 'tuition',
              status: 'succeeded',
              description: `Payment for invoice ${pi.metadata?.invoice_number ?? invoiceId}`,
            });
        }
      }
      break;
    }

    case 'payment_intent.payment_failed': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      const studioId = pi.metadata?.studio_id;

      if (invoiceId && studioId) {
        await supabase
          .from('payments')
          .insert({
            studio_id: studioId,
            family_id: pi.metadata?.family_id ?? '',
            stripe_payment_intent_id: pi.id,
            amount: pi.amount,
            type: 'tuition',
            status: 'failed',
            description: `Failed payment for invoice ${pi.metadata?.invoice_number ?? invoiceId}`,
          });
      }
      break;
    }

    // ── Subscription invoice paid (recurring billing) ──────
    case 'invoice.paid': {
      const inv = event.data.object as Stripe.Invoice;
      const subDetail = inv.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subDetail === 'string' ? subDetail : subDetail?.id;

      if (subscriptionId && inv.amount_paid > 0) {
        // Find the tuition plan by subscription ID
        const { data: plan } = await supabase
          .from('tuition_plans')
          .select('id, studio_id, family_id, name')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (plan) {
          // Record payment
          await supabase
            .from('payments')
            .insert({
              studio_id: plan.studio_id,
              family_id: plan.family_id,
              tuition_plan_id: plan.id,
              stripe_invoice_id: inv.id,
              amount: inv.amount_paid,
              type: 'tuition',
              status: 'succeeded',
              description: `Auto-pay: ${plan.name}`,
            });

          // Update plan period
          if (inv.lines?.data?.[0]) {
            const line = inv.lines.data[0];
            await supabase
              .from('tuition_plans')
              .update({
                status: 'active',
                current_period_start: new Date((line.period?.start ?? 0) * 1000).toISOString(),
                current_period_end: new Date((line.period?.end ?? 0) * 1000).toISOString(),
              })
              .eq('id', plan.id);
          }
        }
      }
      break;
    }

    // ── Subscription invoice failed ────────────────────────
    case 'invoice.payment_failed': {
      const inv = event.data.object as Stripe.Invoice;
      const subDetail = inv.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subDetail === 'string' ? subDetail : subDetail?.id;

      if (subscriptionId) {
        const { data: plan } = await supabase
          .from('tuition_plans')
          .select('id, studio_id, family_id, name')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        if (plan) {
          await supabase
            .from('tuition_plans')
            .update({ status: 'past_due' })
            .eq('id', plan.id);

          await supabase
            .from('payments')
            .insert({
              studio_id: plan.studio_id,
              family_id: plan.family_id,
              tuition_plan_id: plan.id,
              stripe_invoice_id: inv.id,
              amount: inv.amount_due,
              type: 'tuition',
              status: 'failed',
              description: `Failed auto-pay: ${plan.name}`,
            });
        }
      }
      break;
    }

    // ── Subscription updated (status change, period change) ─
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;

      const { data: plan } = await supabase
        .from('tuition_plans')
        .select('id')
        .eq('stripe_subscription_id', sub.id)
        .single();

      if (plan) {
        const statusMap: Record<string, string> = {
          active: 'active',
          past_due: 'past_due',
          canceled: 'cancelled',
          unpaid: 'past_due',
          paused: 'paused',
        };

        const firstItem = sub.items?.data?.[0];
        const updateData: Record<string, unknown> = {
          status: statusMap[sub.status] ?? 'active',
          cancel_at_period_end: sub.cancel_at_period_end,
        };
        if (firstItem) {
          updateData.current_period_start = new Date(firstItem.current_period_start * 1000).toISOString();
          updateData.current_period_end = new Date(firstItem.current_period_end * 1000).toISOString();
        }

        await supabase
          .from('tuition_plans')
          .update(updateData)
          .eq('id', plan.id);
      }
      break;
    }

    // ── Subscription deleted/cancelled ─────────────────────
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;

      await supabase
        .from('tuition_plans')
        .update({ status: 'cancelled', cancel_at_period_end: false })
        .eq('stripe_subscription_id', sub.id);

      break;
    }

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
