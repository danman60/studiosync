import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const invoiceRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  list: adminProcedure
    .input(
      z.object({
        status: z.enum(['draft', 'sent', 'paid', 'partial', 'overdue', 'void', 'cancelled']).optional(),
        familyId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('invoices')
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

  get: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('invoices')
        .select('*, families(parent_first_name, parent_last_name, email, phone), invoice_line_items(*, enrollments(classes(name)))')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (error) throw error;
      return data;
    }),

  create: adminProcedure
    .input(
      z.object({
        family_id: z.string().uuid(),
        due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
        tax_rate: z.number().min(0).max(1).optional(),
        notes: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Generate invoice number: INV-YYYYMMDD-XXX
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const { count } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('studio_id', ctx.studioId);

      const seq = String((count ?? 0) + 1).padStart(3, '0');
      const invoiceNumber = `INV-${dateStr}-${seq}`;

      const { data, error } = await supabase
        .from('invoices')
        .insert({
          studio_id: ctx.studioId,
          family_id: input.family_id,
          invoice_number: invoiceNumber,
          due_date: input.due_date,
          tax_rate: input.tax_rate ?? 0,
          notes: input.notes ?? null,
          issue_date: new Date().toISOString().slice(0, 10),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  addLineItem: adminProcedure
    .input(
      z.object({
        invoice_id: z.string().uuid(),
        description: z.string().min(1).max(500),
        quantity: z.number().int().min(1).default(1),
        unit_price: z.number().int().min(0),
        enrollment_id: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify invoice belongs to studio and is editable
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('id', input.invoice_id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      if (!['draft', 'sent'].includes(invoice.status)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot modify a paid/void invoice' });
      }

      const total = input.quantity * input.unit_price;
      const { data, error } = await supabase
        .from('invoice_line_items')
        .insert({
          invoice_id: input.invoice_id,
          studio_id: ctx.studioId,
          description: input.description,
          quantity: input.quantity,
          unit_price: input.unit_price,
          total,
          enrollment_id: input.enrollment_id ?? null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  removeLineItem: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('invoice_line_items')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  send: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, total')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND' });
      if (invoice.status !== 'draft') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only draft invoices can be sent' });
      }
      if (invoice.total === 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot send a $0 invoice. Add line items first.' });
      }

      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  markPaid: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, total')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND' });
      if (!['sent', 'partial', 'overdue'].includes(invoice.status)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice is not in a payable state' });
      }

      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          amount_paid: invoice.total,
          paid_at: new Date().toISOString(),
        })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  void: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND' });
      if (invoice.status === 'paid') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot void a paid invoice' });
      }

      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'void' })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Stats ──────────────────────────────────────────────

  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const sid = ctx.studioId;

    const [totalRes, draftRes, sentRes, paidRes, overdueRes] = await Promise.all([
      supabase.from('invoices').select('total', { count: 'exact' }).eq('studio_id', sid),
      supabase.from('invoices').select('id', { count: 'exact', head: true }).eq('studio_id', sid).eq('status', 'draft'),
      supabase.from('invoices').select('total').eq('studio_id', sid).eq('status', 'sent'),
      supabase.from('invoices').select('total').eq('studio_id', sid).eq('status', 'paid'),
      supabase.from('invoices').select('total').eq('studio_id', sid).eq('status', 'overdue'),
    ]);

    const outstanding = [...(sentRes.data ?? []), ...(overdueRes.data ?? [])].reduce(
      (sum, i) => sum + (i.total ?? 0), 0
    );
    const collected = (paidRes.data ?? []).reduce((sum, i) => sum + (i.total ?? 0), 0);

    return {
      totalInvoices: totalRes.count ?? 0,
      draftCount: draftRes.count ?? 0,
      outstanding,
      collected,
    };
  }),

  // ═══════════════════════════════════════════════════════
  // PARENT PROCEDURES
  // ═══════════════════════════════════════════════════════

  myInvoices: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    if (!ctx.familyId) return [];

    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .in('status', ['sent', 'paid', 'partial', 'overdue'])
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  myInvoiceDetail: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found' });
      }

      const { data, error } = await supabase
        .from('invoices')
        .select('*, invoice_line_items(*)')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .eq('family_id', ctx.familyId)
        .single();

      if (error) throw error;
      return data;
    }),

  createPaymentIntent: protectedProcedure
    .input(z.object({ invoiceId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found' });
      }

      // Get invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('*, families(email, parent_first_name, parent_last_name)')
        .eq('id', input.invoiceId)
        .eq('studio_id', ctx.studioId)
        .eq('family_id', ctx.familyId)
        .single();

      if (!invoice) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      }

      if (!['sent', 'partial', 'overdue'].includes(invoice.status)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice is not payable' });
      }

      const amountDue = invoice.total - invoice.amount_paid;
      if (amountDue <= 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Invoice is already fully paid' });
      }

      // Get studio's Stripe account for Connect
      const { data: studio } = await supabase
        .from('studios')
        .select('stripe_account_id')
        .eq('id', ctx.studioId)
        .single();

      const family = invoice.families as unknown as { email: string; parent_first_name: string; parent_last_name: string } | null;

      // Create PaymentIntent
      const piParams: Stripe.PaymentIntentCreateParams = {
        amount: amountDue,
        currency: 'usd',
        metadata: {
          invoice_id: invoice.id,
          invoice_number: invoice.invoice_number,
          studio_id: ctx.studioId,
          family_id: ctx.familyId ?? '',
        },
        description: `Invoice ${invoice.invoice_number}`,
        receipt_email: family?.email ?? undefined,
        ...(studio?.stripe_account_id
          ? { transfer_data: { destination: studio.stripe_account_id } }
          : {}),
      };

      const paymentIntent = await getStripe().paymentIntents.create(piParams);

      // Store PI ID on invoice
      await supabase
        .from('invoices')
        .update({ stripe_payment_intent_id: paymentIntent.id })
        .eq('id', invoice.id)
        .eq('studio_id', ctx.studioId);

      return {
        clientSecret: paymentIntent.client_secret,
        amount: amountDue,
      };
    }),
});
