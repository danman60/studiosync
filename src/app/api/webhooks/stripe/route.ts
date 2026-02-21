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
    case 'payment_intent.succeeded': {
      const pi = event.data.object as Stripe.PaymentIntent;
      const invoiceId = pi.metadata?.invoice_id;
      const studioId = pi.metadata?.studio_id;

      if (invoiceId && studioId) {
        // Get invoice to determine if fully paid
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

          // Record payment in payments table
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
        // Record failed payment
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

    default:
      // Unhandled event type — acknowledge receipt
      break;
  }

  return NextResponse.json({ received: true });
}
