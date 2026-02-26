import { z } from 'zod';
import { adminProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const familyTagRouter = router({
  /** List tags for a specific family */
  list: adminProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('family_tags')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('family_id', input.familyId)
        .order('tag');

      if (error) throw error;
      return data ?? [];
    }),

  /** Add a tag to a family */
  add: adminProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      tag: z.string().min(1).max(50).transform(s => s.toLowerCase().trim()),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('family_tags')
        .insert({
          studio_id: ctx.studioId,
          family_id: input.familyId,
          tag: input.tag,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          throw new Error('This family already has this tag.');
        }
        throw error;
      }
      return data;
    }),

  /** Remove a tag from a family */
  remove: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { error } = await supabase
        .from('family_tags')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  /** Get all distinct tags in the studio (for autocomplete) */
  allTags: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('family_tags')
      .select('tag')
      .eq('studio_id', ctx.studioId);

    if (error) throw error;
    const unique = [...new Set((data ?? []).map(d => d.tag))].sort();
    return unique;
  }),

  /** Get all families with a given tag */
  familiesByTag: adminProcedure
    .input(z.object({ tag: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('family_tags')
        .select('family_id, families(id, parent_first_name, parent_last_name, email)')
        .eq('studio_id', ctx.studioId)
        .eq('tag', input.tag);

      if (error) throw error;
      return (data ?? []).map(d => d.families).filter(Boolean);
    }),

  /** Bulk tag multiple families */
  bulkTag: adminProcedure
    .input(z.object({
      familyIds: z.array(z.string().uuid()).min(1),
      tag: z.string().min(1).max(50).transform(s => s.toLowerCase().trim()),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const rows = input.familyIds.map(familyId => ({
        studio_id: ctx.studioId,
        family_id: familyId,
        tag: input.tag,
      }));

      // Use upsert to skip duplicates
      const { data, error } = await supabase
        .from('family_tags')
        .upsert(rows, { onConflict: 'studio_id,family_id,tag', ignoreDuplicates: true })
        .select();

      if (error) throw error;
      return { tagged: data?.length ?? 0 };
    }),
});
