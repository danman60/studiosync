import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { sendNotification } from '@/lib/notifications';
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
        .select('id, status, total, family_id, invoice_number, families(email, parent_first_name)')
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

      // Fire notification (non-blocking)
      const family = invoice.families as unknown as { email: string; parent_first_name: string } | null;
      if (family?.email) {
        sendNotification({
          studioId: ctx.studioId,
          familyId: invoice.family_id,
          type: 'invoice_sent',
          subject: `Invoice #${invoice.invoice_number} Ready`,
          body: `Hi ${family.parent_first_name}, your invoice #${invoice.invoice_number} for $${(invoice.total / 100).toFixed(2)} is ready for payment.`,
          recipientEmail: family.email,
        });
      }

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

  applyDiscount: adminProcedure
    .input(z.object({
      invoice_id: z.string().uuid(),
      promo_code_id: z.string().uuid(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, subtotal, total, family_id, discount_amount, promo_code_id')
        .eq('id', input.invoice_id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      if (!['draft', 'sent'].includes(invoice.status)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot apply discount to this invoice' });
      }
      if (invoice.promo_code_id) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Invoice already has a discount applied' });
      }

      // Get promo code
      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('id', input.promo_code_id)
        .eq('studio_id', ctx.studioId)
        .eq('is_active', true)
        .single();

      if (!promo) throw new TRPCError({ code: 'NOT_FOUND', message: 'Promo code not found' });
      if (promo.applies_to !== 'all' && promo.applies_to !== 'invoice') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'This code cannot be applied to invoices' });
      }
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Code has reached its usage limit' });
      }

      // Calculate discount
      let discountAmount = 0;
      if (promo.discount_type === 'percent') {
        discountAmount = Math.round(invoice.subtotal * (promo.discount_value / 10000));
      } else {
        discountAmount = Math.min(promo.discount_value, invoice.subtotal);
      }

      if (discountAmount <= 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Discount amount is zero' });
      }

      // Add negative line item
      await supabase.from('invoice_line_items').insert({
        invoice_id: invoice.id,
        studio_id: ctx.studioId,
        description: `Discount (${promo.code})`,
        quantity: 1,
        unit_price: -discountAmount,
        total: -discountAmount,
      });

      // Update invoice totals
      const newTotal = Math.max(0, invoice.total - discountAmount);
      await supabase
        .from('invoices')
        .update({
          discount_amount: discountAmount,
          promo_code_id: promo.id,
          total: newTotal,
        })
        .eq('id', invoice.id)
        .eq('studio_id', ctx.studioId);

      // Record application
      await supabase.from('discount_applications').insert({
        studio_id: ctx.studioId,
        promo_code_id: promo.id,
        family_id: invoice.family_id,
        invoice_id: invoice.id,
        discount_amount: discountAmount,
      });

      // Increment usage
      await supabase
        .from('promo_codes')
        .update({ current_uses: promo.current_uses + 1 })
        .eq('id', promo.id)
        .eq('studio_id', ctx.studioId);

      return { discountAmount, newTotal };
    }),

  /** Auto-apply sibling discount to an invoice based on studio settings */
  applySiblingDiscount: adminProcedure
    .input(z.object({ invoice_id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get invoice
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, subtotal, total, family_id, discount_amount, promo_code_id')
        .eq('id', input.invoice_id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND', message: 'Invoice not found' });
      if (!['draft', 'sent'].includes(invoice.status)) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Cannot apply discount to this invoice' });
      }

      // Get studio sibling discount settings
      const { data: studio } = await supabase
        .from('studios')
        .select('settings')
        .eq('id', ctx.studioId)
        .single();

      const settings = (studio?.settings ?? {}) as Record<string, unknown>;
      if (!settings.sibling_discount_enabled) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Sibling discount is not enabled' });
      }

      const discountType = String(settings.sibling_discount_type ?? 'percent');
      const discountValue = Number(settings.sibling_discount_value ?? 0);
      const minStudents = Number(settings.sibling_discount_min_students ?? 2);

      if (discountValue <= 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Sibling discount value is not configured' });
      }

      // Count active students in this family
      const { count: studentCount } = await supabase
        .from('students')
        .select('id', { count: 'exact', head: true })
        .eq('studio_id', ctx.studioId)
        .eq('family_id', invoice.family_id);

      if ((studentCount ?? 0) < minStudents) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `Family needs at least ${minStudents} students for sibling discount (currently ${studentCount ?? 0})`,
        });
      }

      // Calculate discount
      let discountAmount = 0;
      if (discountType === 'percent') {
        discountAmount = Math.round(invoice.subtotal * (discountValue / 10000));
      } else {
        discountAmount = Math.min(discountValue, invoice.subtotal);
      }

      if (discountAmount <= 0) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Calculated discount is zero' });
      }

      // Add negative line item
      await supabase.from('invoice_line_items').insert({
        invoice_id: invoice.id,
        studio_id: ctx.studioId,
        description: 'Sibling Discount',
        quantity: 1,
        unit_price: -discountAmount,
        total: -discountAmount,
      });

      // Update invoice totals
      const newTotal = Math.max(0, invoice.total - discountAmount);
      const newDiscountAmount = (invoice.discount_amount ?? 0) + discountAmount;
      await supabase
        .from('invoices')
        .update({ discount_amount: newDiscountAmount, total: newTotal })
        .eq('id', invoice.id)
        .eq('studio_id', ctx.studioId);

      return { discountAmount, newTotal };
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

  /** Mark overdue invoices and apply late fees (called by cron or admin) */
  processOverdue: adminProcedure.mutation(async ({ ctx }) => {
    const supabase = createServiceClient();
    const today = new Date().toISOString().slice(0, 10);

    // Get studio late fee settings
    const { data: studio } = await supabase
      .from('studios')
      .select('settings')
      .eq('id', ctx.studioId)
      .single();

    const settings = (studio?.settings ?? {}) as Record<string, unknown>;
    const lateFeeAmount = Number(settings.late_fee_amount ?? 0); // cents
    const lateFeeType = String(settings.late_fee_type ?? 'flat'); // 'flat' or 'percent'
    const graceDays = Number(settings.late_fee_grace_days ?? 0);

    // Calculate the cutoff date (due_date + grace_days)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - graceDays);
    const cutoffStr = cutoffDate.toISOString().slice(0, 10);

    // 1. Mark sent/partial invoices as overdue if past due date
    const { data: overdueInvoices } = await supabase
      .from('invoices')
      .select('id, total, late_fee_amount, late_fee_applied_at')
      .eq('studio_id', ctx.studioId)
      .in('status', ['sent', 'partial'])
      .lt('due_date', today);

    let markedOverdue = 0;
    let feesApplied = 0;

    if (overdueInvoices?.length) {
      // Mark them overdue
      await supabase
        .from('invoices')
        .update({ status: 'overdue' })
        .eq('studio_id', ctx.studioId)
        .in('status', ['sent', 'partial'])
        .lt('due_date', today);

      markedOverdue = overdueInvoices.length;

      // 2. Apply late fees if configured and past grace period
      if (lateFeeAmount > 0) {
        for (const inv of overdueInvoices) {
          // Skip if already has a late fee
          if (inv.late_fee_applied_at) continue;

          let fee = 0;
          if (lateFeeType === 'percent') {
            fee = Math.round(inv.total * (lateFeeAmount / 10000)); // lateFeeAmount is basis points (e.g., 500 = 5%)
          } else {
            fee = lateFeeAmount;
          }

          if (fee > 0) {
            // Add late fee as a line item
            await supabase
              .from('invoice_line_items')
              .insert({
                invoice_id: inv.id,
                studio_id: ctx.studioId,
                description: 'Late Fee',
                quantity: 1,
                unit_price: fee,
                total: fee,
              });

            // Update invoice totals
            await supabase
              .from('invoices')
              .update({
                late_fee_amount: fee,
                late_fee_applied_at: new Date().toISOString(),
                subtotal: inv.total + fee, // simplified — actual subtotal recalc
                total: inv.total + fee,
              })
              .eq('id', inv.id)
              .eq('studio_id', ctx.studioId);

            feesApplied++;
          }
        }
      }
    }

    return { markedOverdue, feesApplied };
  }),

  // ── Refund (full or partial via Stripe) ────────────────

  refund: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      amount: z.number().int().min(1).optional(), // cents — omit for full refund
      reason: z.string().max(500).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, status, total, amount_paid, stripe_payment_intent_id, family_id, invoice_number, families(email, parent_first_name)')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!invoice) throw new TRPCError({ code: 'NOT_FOUND' });
      if (invoice.status !== 'paid' && invoice.status !== 'partial') {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Only paid or partially paid invoices can be refunded' });
      }

      const refundAmount = input.amount ?? invoice.amount_paid;
      if (refundAmount > invoice.amount_paid) {
        throw new TRPCError({ code: 'PRECONDITION_FAILED', message: 'Refund amount exceeds amount paid' });
      }

      // Attempt Stripe refund if payment was via Stripe
      if (invoice.stripe_payment_intent_id) {
        try {
          await getStripe().refunds.create({
            payment_intent: invoice.stripe_payment_intent_id,
            amount: refundAmount,
            reason: 'requested_by_customer',
          });
        } catch (err) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Stripe refund failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
          });
        }
      }

      // Update invoice
      const newAmountPaid = invoice.amount_paid - refundAmount;
      const newStatus = refundAmount >= invoice.amount_paid ? 'void' : 'partial';

      const { data, error } = await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          status: newStatus,
        })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;

      // Record refund payment
      await supabase.from('payments').insert({
        studio_id: ctx.studioId,
        family_id: invoice.family_id,
        amount: -refundAmount,
        type: 'refund',
        status: 'succeeded',
        description: `Refund for Invoice #${invoice.invoice_number}${input.reason ? ': ' + input.reason : ''}`,
      });

      // Notify family (non-blocking)
      const family = invoice.families as unknown as { email: string; parent_first_name: string } | null;
      if (family?.email) {
        sendNotification({
          studioId: ctx.studioId,
          familyId: invoice.family_id,
          type: 'invoice_sent',
          subject: `Refund Processed — Invoice #${invoice.invoice_number}`,
          body: `Hi ${family.parent_first_name}, a refund of $${(refundAmount / 100).toFixed(2)} has been processed for invoice #${invoice.invoice_number}.`,
          recipientEmail: family.email,
        });
      }

      return data;
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
    .input(z.object({
      invoiceId: z.string().uuid(),
      paymentMethod: z.enum(['card', 'us_bank_account']).default('card'),
    }))
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

      // Create PaymentIntent with chosen method
      const paymentMethodTypes: string[] = input.paymentMethod === 'us_bank_account'
        ? ['us_bank_account']
        : ['card'];

      const piParams: Stripe.PaymentIntentCreateParams = {
        amount: amountDue,
        currency: 'usd',
        payment_method_types: paymentMethodTypes,
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
