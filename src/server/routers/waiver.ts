import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, studioProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const waiverRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** List all waivers for this studio */
  list: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('waivers')
      .select('*, seasons(name)')
      .eq('studio_id', ctx.studioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  /** Create a new waiver template */
  create: adminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(200),
        content: z.string().min(1).max(50000),
        season_id: z.string().uuid().nullable().default(null),
        is_required: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('waivers')
        .insert({
          studio_id: ctx.studioId,
          title: input.title,
          content: input.content,
          season_id: input.season_id,
          is_required: input.is_required,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Update a waiver (bumps version) */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        title: z.string().min(1).max(200).optional(),
        content: z.string().min(1).max(50000).optional(),
        season_id: z.string().uuid().nullable().optional(),
        is_required: z.boolean().optional(),
        is_active: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { id, ...updates } = input;

      // If content changed, bump version
      if (updates.content) {
        const { data: existing } = await supabase
          .from('waivers')
          .select('version')
          .eq('id', id)
          .eq('studio_id', ctx.studioId)
          .single();

        if (existing) {
          (updates as Record<string, unknown>).version = existing.version + 1;
        }
      }

      const { data, error } = await supabase
        .from('waivers')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  /** Delete a waiver */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('waivers')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  /** View signature report for a waiver */
  signatures: adminProcedure
    .input(
      z.object({
        waiverId: z.string().uuid().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('waiver_signatures')
        .select('*, waivers(title, version), families(parent_first_name, parent_last_name, email), students(first_name, last_name)')
        .eq('studio_id', ctx.studioId);

      if (input?.waiverId) {
        query = query.eq('waiver_id', input.waiverId);
      }

      const { data, error } = await query
        .order('signed_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      return data ?? [];
    }),

  /** Stats for admin dashboard */
  stats: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const [waiverRes, sigRes, activeRes] = await Promise.all([
      supabase.from('waivers').select('id', { count: 'exact', head: true }).eq('studio_id', ctx.studioId),
      supabase.from('waiver_signatures').select('id', { count: 'exact', head: true }).eq('studio_id', ctx.studioId),
      supabase.from('waivers').select('id', { count: 'exact', head: true }).eq('studio_id', ctx.studioId).eq('is_active', true),
    ]);

    return {
      totalWaivers: waiverRes.count ?? 0,
      activeWaivers: activeRes.count ?? 0,
      totalSignatures: sigRes.count ?? 0,
    };
  }),

  // ═══════════════════════════════════════════════════════
  // PUBLIC PROCEDURES (registration flow)
  // ═══════════════════════════════════════════════════════

  /** Get active waivers for a class's season (used in registration) */
  getForRegistration: studioProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get the class's season
      const { data: cls } = await supabase
        .from('classes')
        .select('season_id')
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!cls) return [];

      // Get active waivers: studio-wide (no season) OR matching season
      let query = supabase
        .from('waivers')
        .select('id, title, content, is_required, version')
        .eq('studio_id', ctx.studioId)
        .eq('is_active', true);

      if (cls.season_id) {
        query = query.or(`season_id.is.null,season_id.eq.${cls.season_id}`);
      } else {
        query = query.is('season_id', null);
      }

      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    }),

  // ═══════════════════════════════════════════════════════
  // PARENT PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Parent: view own signed waivers */
  mySignatures: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    if (!ctx.familyId) return [];

    const { data, error } = await supabase
      .from('waiver_signatures')
      .select('*, waivers(title, content, version)')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .order('signed_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  /** Parent: view pending waivers (active waivers not yet signed) */
  myPendingWaivers: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    if (!ctx.familyId) return [];

    // Get all active required waivers
    const { data: waivers } = await supabase
      .from('waivers')
      .select('id, title, content, is_required, version')
      .eq('studio_id', ctx.studioId)
      .eq('is_active', true)
      .eq('is_required', true);

    if (!waivers?.length) return [];

    // Get existing signatures
    const { data: sigs } = await supabase
      .from('waiver_signatures')
      .select('waiver_id, waiver_version')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId);

    const signedMap = new Map((sigs ?? []).map((s) => [s.waiver_id, s.waiver_version]));

    // Filter to unsigned or outdated-version waivers
    return waivers.filter((w) => {
      const signedVersion = signedMap.get(w.id);
      return signedVersion === undefined || signedVersion < w.version;
    });
  }),

  /** Parent: sign a waiver from the portal */
  sign: protectedProcedure
    .input(
      z.object({
        waiverId: z.string().uuid(),
        parentName: z.string().min(1),
        studentId: z.string().uuid().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family found' });
      }

      // Get waiver
      const { data: waiver } = await supabase
        .from('waivers')
        .select('id, version, is_active')
        .eq('id', input.waiverId)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!waiver || !waiver.is_active) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Waiver not found or inactive' });
      }

      // Get family email
      const { data: family } = await supabase
        .from('families')
        .select('email')
        .eq('id', ctx.familyId)
        .eq('studio_id', ctx.studioId)
        .single();

      const { data, error } = await supabase
        .from('waiver_signatures')
        .insert({
          studio_id: ctx.studioId,
          waiver_id: waiver.id,
          family_id: ctx.familyId,
          student_id: input.studentId ?? null,
          parent_name: input.parentName,
          parent_email: family?.email ?? '',
          waiver_version: waiver.version,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),
});
