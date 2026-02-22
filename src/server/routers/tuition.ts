import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';

/**
 * Ensure a Stripe Customer exists for the given family.
 * Creates one if missing, stores the ID on the family row.
 */
async function ensureStripeCustomer(
  studioId: string,
  familyId: string,
  _stripeAccountId: string | null,
): Promise<string> {
  const supabase = createServiceClient();

  const { data: family } = await supabase
    .from('families')
    .select('id, stripe_customer_id, email, parent_first_name, parent_last_name')
    .eq('id', familyId)
    .eq('studio_id', studioId)
    .single();

  if (!family) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Family not found' });
  }

  if (family.stripe_customer_id) {
    return family.stripe_customer_id;
  }

  // Create Stripe Customer on the platform (not the connected account)
  const customer = await getStripe().customers.create({
    email: family.email,
    name: `${family.parent_first_name} ${family.parent_last_name}`,
    metadata: {
      studio_id: studioId,
      family_id: familyId,
    },
  });

  await supabase
    .from('families')
    .update({ stripe_customer_id: customer.id })
    .eq('id', familyId)
    .eq('studio_id', studioId);

  return customer.id;
}

export const tuitionRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** List all tuition plans for this studio */
  list: adminProcedure
    .input(
      z.object({
        status: z.enum(['active', 'past_due', 'cancelled', 'paused']).optional(),
        familyId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('tuition_plans')
        .select('*, families(parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId);

      if (input?.status) query = query.eq('status', input.status);
      if (input?.familyId) query = query.eq('family_id', input.familyId);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      return data ?? [];
    }),

  /** Create a tuition plan + Stripe Subscription for a family */
  create: adminProcedure
    .input(
      z.object({
        family_id: z.string().uuid(),
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        amount: z.number().int().min(100), // cents, minimum $1
        interval: z.enum(['month', 'year']).default('month'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const stripe = getStripe();

      // Get studio's Stripe Connect account
      const { data: studio } = await supabase
        .from('studios')
        .select('stripe_account_id, stripe_onboarding_complete, name')
        .eq('id', ctx.studioId)
        .single();

      if (!studio?.stripe_onboarding_complete) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: 'Stripe Connect must be set up before creating tuition plans. Go to Settings to connect your Stripe account.',
        });
      }

      // Ensure Stripe Customer exists
      const customerId = await ensureStripeCustomer(ctx.studioId, input.family_id, studio.stripe_account_id);

      // Create a Stripe Product + Price for this plan
      const product = await stripe.products.create({
        name: input.name,
        description: input.description ?? undefined,
        metadata: {
          studio_id: ctx.studioId,
          type: 'tuition_plan',
        },
      });

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: input.amount,
        currency: 'usd',
        recurring: { interval: input.interval },
        metadata: {
          studio_id: ctx.studioId,
        },
      });

      // Create Stripe Subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: price.id }],
        metadata: {
          studio_id: ctx.studioId,
          family_id: input.family_id,
        },
        transfer_data: studio.stripe_account_id
          ? { destination: studio.stripe_account_id }
          : undefined,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Save tuition plan to DB
      const { data, error } = await supabase
        .from('tuition_plans')
        .insert({
          studio_id: ctx.studioId,
          family_id: input.family_id,
          name: input.name,
          description: input.description ?? null,
          stripe_subscription_id: subscription.id,
          stripe_price_id: price.id,
          amount: input.amount,
          interval: input.interval,
          status: 'active',
          current_period_start: subscription.items?.data?.[0]
            ? new Date(subscription.items.data[0].current_period_start * 1000).toISOString()
            : new Date().toISOString(),
          current_period_end: subscription.items?.data?.[0]
            ? new Date(subscription.items.data[0].current_period_end * 1000).toISOString()
            : new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Return client secret if payment needs completing
      const latestInvoice = subscription.latest_invoice as { payment_intent?: { client_secret?: string } } | null;
      const clientSecret = latestInvoice?.payment_intent?.client_secret ?? null;

      return { plan: data, clientSecret };
    }),

  /** Cancel a tuition plan (end of period or immediately) */
  cancel: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        immediately: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const stripe = getStripe();

      const { data: plan } = await supabase
        .from('tuition_plans')
        .select('*')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (plan.status === 'cancelled') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Plan is already cancelled' });
      }

      if (plan.stripe_subscription_id) {
        if (input.immediately) {
          await stripe.subscriptions.cancel(plan.stripe_subscription_id);
        } else {
          await stripe.subscriptions.update(plan.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
        }
      }

      const { data, error } = await supabase
        .from('tuition_plans')
        .update({
          status: input.immediately ? 'cancelled' : plan.status,
          cancel_at_period_end: !input.immediately,
        })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Pause a subscription */
  pause: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const stripe = getStripe();

      const { data: plan } = await supabase
        .from('tuition_plans')
        .select('*')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (plan.status !== 'active') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only active plans can be paused' });
      }

      if (plan.stripe_subscription_id) {
        await stripe.subscriptions.update(plan.stripe_subscription_id, {
          pause_collection: { behavior: 'mark_uncollectible' },
        });
      }

      const { data, error } = await supabase
        .from('tuition_plans')
        .update({ status: 'paused' })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Resume a paused subscription */
  resume: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const stripe = getStripe();

      const { data: plan } = await supabase
        .from('tuition_plans')
        .select('*')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (plan.status !== 'paused') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only paused plans can be resumed' });
      }

      if (plan.stripe_subscription_id) {
        await stripe.subscriptions.update(plan.stripe_subscription_id, {
          pause_collection: '',
        });
      }

      const { data, error } = await supabase
        .from('tuition_plans')
        .update({ status: 'active' })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Stats for admin dashboard */
  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const sid = ctx.studioId;

    const [activeRes, pastDueRes, allRes] = await Promise.all([
      supabase.from('tuition_plans').select('amount').eq('studio_id', sid).eq('status', 'active'),
      supabase.from('tuition_plans').select('amount').eq('studio_id', sid).eq('status', 'past_due'),
      supabase.from('tuition_plans').select('id', { count: 'exact', head: true }).eq('studio_id', sid),
    ]);

    const activeRevenue = (activeRes.data ?? []).reduce((sum, p) => sum + p.amount, 0);
    const pastDueAmount = (pastDueRes.data ?? []).reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPlans: allRes.count ?? 0,
      activeCount: activeRes.data?.length ?? 0,
      pastDueCount: pastDueRes.data?.length ?? 0,
      monthlyRecurring: activeRevenue,
      pastDueAmount,
    };
  }),

  // ═══════════════════════════════════════════════════════
  // PARENT PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Parent: view own tuition plans */
  myPlans: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    if (!ctx.familyId) return [];

    const { data, error } = await supabase
      .from('tuition_plans')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .in('status', ['active', 'past_due', 'paused'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  /** Parent: request cancellation (sets cancel_at_period_end) */
  requestCancel: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const stripe = getStripe();

      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found' });
      }

      const { data: plan } = await supabase
        .from('tuition_plans')
        .select('*')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .eq('family_id', ctx.familyId)
        .single();

      if (!plan) throw new TRPCError({ code: 'NOT_FOUND' });
      if (plan.status !== 'active') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Plan is not active' });
      }

      // Set cancel at period end (parent can't immediately cancel — studio admin can)
      if (plan.stripe_subscription_id) {
        await stripe.subscriptions.update(plan.stripe_subscription_id, {
          cancel_at_period_end: true,
        });
      }

      const { data, error } = await supabase
        .from('tuition_plans')
        .update({ cancel_at_period_end: true })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .eq('family_id', ctx.familyId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),
});
