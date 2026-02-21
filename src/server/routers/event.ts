import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, studioProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const eventRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  list: adminProcedure
    .input(z.object({
      status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('events')
        .select('*')
        .eq('studio_id', ctx.studioId);

      if (input?.status) query = query.eq('status', input.status);

      const { data, error } = await query
        .order('event_date', { ascending: true });

      if (error) throw error;
      return data ?? [];
    }),

  create: adminProcedure
    .input(z.object({
      name: z.string().min(1).max(200),
      description: z.string().max(5000).optional(),
      event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
      location: z.string().max(500).optional(),
      ticket_price: z.number().int().min(0).default(0),
      max_tickets: z.number().int().min(1).optional(),
      is_public: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('events')
        .insert({
          studio_id: ctx.studioId,
          name: input.name,
          description: input.description ?? null,
          event_date: input.event_date,
          event_time: input.event_time ?? null,
          end_time: input.end_time ?? null,
          location: input.location ?? null,
          ticket_price: input.ticket_price,
          max_tickets: input.max_tickets ?? null,
          is_public: input.is_public ?? false,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      name: z.string().min(1).max(200).optional(),
      description: z.string().max(5000).nullable().optional(),
      event_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      event_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
      end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
      location: z.string().max(500).nullable().optional(),
      ticket_price: z.number().int().min(0).optional(),
      max_tickets: z.number().int().min(1).nullable().optional(),
      status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
      is_public: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();

      // If publishing, set published fields
      if (updates.status === 'published') {
        (updates as Record<string, unknown>).is_public = true;
      }

      const { data, error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Only allow deleting draft events with no orders
      const { data: event } = await supabase
        .from('events')
        .select('id, status, tickets_sold')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!event) throw new TRPCError({ code: 'NOT_FOUND' });
      if (event.tickets_sold > 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot delete event with ticket orders. Cancel it instead.' });
      }

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  orders: adminProcedure
    .input(z.object({ eventId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('ticket_orders')
        .select('*, families(parent_first_name, parent_last_name)')
        .eq('event_id', input.eventId)
        .eq('studio_id', ctx.studioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    }),

  // ═══════════════════════════════════════════════════════
  // PUBLIC / PARENT PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Published events visible to anyone on the studio */
  published: studioProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('status', 'published')
      .eq('is_public', true)
      .gte('event_date', new Date().toISOString().slice(0, 10))
      .order('event_date', { ascending: true });

    if (error) throw error;
    return data ?? [];
  }),

  /** Purchase tickets (creates PaymentIntent for paid events, or confirms free) */
  purchaseTicket: protectedProcedure
    .input(z.object({
      eventId: z.string().uuid(),
      quantity: z.number().int().min(1).max(20),
      buyerName: z.string().min(1).max(200),
      buyerEmail: z.string().email(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: event } = await supabase
        .from('events')
        .select('*')
        .eq('id', input.eventId)
        .eq('studio_id', ctx.studioId)
        .eq('status', 'published')
        .single();

      if (!event) throw new TRPCError({ code: 'NOT_FOUND', message: 'Event not found or not available' });

      // Check capacity
      if (event.max_tickets && event.tickets_sold + input.quantity > event.max_tickets) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Not enough tickets available' });
      }

      const totalAmount = event.ticket_price * input.quantity;

      // Create order
      const { data: order, error: orderErr } = await supabase
        .from('ticket_orders')
        .insert({
          studio_id: ctx.studioId,
          event_id: input.eventId,
          family_id: ctx.familyId ?? null,
          buyer_name: input.buyerName,
          buyer_email: input.buyerEmail,
          quantity: input.quantity,
          total_amount: totalAmount,
          status: totalAmount === 0 ? 'confirmed' : 'pending',
        })
        .select()
        .single();

      if (orderErr) throw orderErr;

      // Free event — auto-confirm
      if (totalAmount === 0) {
        return { order, clientSecret: null };
      }

      // Paid event — create Stripe PaymentIntent
      const { data: studio } = await supabase
        .from('studios')
        .select('stripe_account_id')
        .eq('id', ctx.studioId)
        .single();

      const piParams: Stripe.PaymentIntentCreateParams = {
        amount: totalAmount,
        currency: 'usd',
        metadata: {
          ticket_order_id: order.id,
          event_id: event.id,
          studio_id: ctx.studioId,
        },
        description: `${input.quantity}x tickets for ${event.name}`,
        receipt_email: input.buyerEmail,
        ...(studio?.stripe_account_id
          ? { transfer_data: { destination: studio.stripe_account_id } }
          : {}),
      };

      const paymentIntent = await getStripe().paymentIntents.create(piParams);

      // Store PI ID on order
      await supabase
        .from('ticket_orders')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', order.id)
        .eq('studio_id', ctx.studioId);

      return {
        order,
        clientSecret: paymentIntent.client_secret,
      };
    }),
});
