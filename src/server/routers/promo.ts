import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, studioProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const promoRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  list: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1).max(50).transform((v) => v.toUpperCase().replace(/\s/g, '')),
        description: z.string().max(500).optional(),
        discount_type: z.enum(['flat', 'percent']),
        discount_value: z.number().int().min(1),
        max_uses: z.number().int().min(1).optional(),
        min_purchase: z.number().int().min(0).optional(),
        starts_at: z.string().optional(),
        expires_at: z.string().optional(),
        applies_to: z.enum(['all', 'registration', 'invoice', 'tuition']).default('all'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Check for duplicate code
      const { data: existing } = await supabase
        .from('promo_codes')
        .select('id')
        .eq('studio_id', ctx.studioId)
        .eq('code', input.code)
        .maybeSingle();

      if (existing) {
        throw new TRPCError({ code: 'CONFLICT', message: `Code "${input.code}" already exists` });
      }

      const { data, error } = await supabase
        .from('promo_codes')
        .insert({
          studio_id: ctx.studioId,
          code: input.code,
          description: input.description ?? null,
          discount_type: input.discount_type,
          discount_value: input.discount_value,
          max_uses: input.max_uses ?? null,
          min_purchase: input.min_purchase ?? 0,
          starts_at: input.starts_at ?? null,
          expires_at: input.expires_at ?? null,
          applies_to: input.applies_to,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        code: z.string().min(1).max(50).transform((v) => v.toUpperCase().replace(/\s/g, '')).optional(),
        description: z.string().max(500).nullable().optional(),
        discount_type: z.enum(['flat', 'percent']).optional(),
        discount_value: z.number().int().min(1).optional(),
        max_uses: z.number().int().min(1).nullable().optional(),
        min_purchase: z.number().int().min(0).optional(),
        starts_at: z.string().nullable().optional(),
        expires_at: z.string().nullable().optional(),
        applies_to: z.enum(['all', 'registration', 'invoice', 'tuition']).optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('promo_codes')
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
      const { error } = await supabase
        .from('promo_codes')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const [codesRes, activeRes, appsRes] = await Promise.all([
      supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('studio_id', ctx.studioId),
      supabase.from('promo_codes').select('id', { count: 'exact', head: true }).eq('studio_id', ctx.studioId).eq('is_active', true),
      supabase.from('discount_applications').select('discount_amount').eq('studio_id', ctx.studioId),
    ]);

    const totalSaved = (appsRes.data ?? []).reduce((sum, a) => sum + a.discount_amount, 0);

    return {
      totalCodes: codesRes.count ?? 0,
      activeCodes: activeRes.count ?? 0,
      totalApplications: appsRes.data?.length ?? 0,
      totalSaved,
    };
  }),

  applications: adminProcedure
    .input(z.object({ promoCodeId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('discount_applications')
        .select('*, families(parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId)
        .eq('promo_code_id', input.promoCodeId)
        .order('applied_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    }),

  // ═══════════════════════════════════════════════════════
  // PUBLIC — Validate promo code during registration
  // ═══════════════════════════════════════════════════════

  validate: studioProcedure
    .input(
      z.object({
        code: z.string().min(1).transform((v) => v.toUpperCase().replace(/\s/g, '')),
        context: z.enum(['all', 'registration', 'invoice', 'tuition']).default('registration'),
      })
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const now = new Date().toISOString();

      const { data: promo } = await supabase
        .from('promo_codes')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('code', input.code)
        .eq('is_active', true)
        .maybeSingle();

      if (!promo) {
        return { valid: false as const, message: 'Invalid promo code' };
      }

      // Check date range
      if (promo.starts_at && promo.starts_at > now) {
        return { valid: false as const, message: 'This code is not yet active' };
      }
      if (promo.expires_at && promo.expires_at < now) {
        return { valid: false as const, message: 'This code has expired' };
      }

      // Check usage limit
      if (promo.max_uses && promo.current_uses >= promo.max_uses) {
        return { valid: false as const, message: 'This code has reached its usage limit' };
      }

      // Check context
      if (promo.applies_to !== 'all' && promo.applies_to !== input.context) {
        return { valid: false as const, message: 'This code cannot be used here' };
      }

      return {
        valid: true as const,
        promoCodeId: promo.id,
        code: promo.code,
        description: promo.description,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        min_purchase: promo.min_purchase,
      };
    }),
});
