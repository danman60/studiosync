import { z } from 'zod';
import { studioProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const catalogRouter = router({
  listClasses: studioProcedure
    .input(
      z.object({
        seasonId: z.string().uuid().optional(),
        classTypeId: z.string().uuid().optional(),
        levelId: z.string().uuid().optional(),
        dayOfWeek: z.number().min(0).max(6).optional(),
        minAge: z.number().optional(),
        maxAge: z.number().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('classes')
        .select(
          '*, class_types(*), levels(*), seasons(*), staff(display_name)'
        )
        .eq('studio_id', ctx.studioId)
        .eq('is_public', true);

      if (input?.seasonId) query = query.eq('season_id', input.seasonId);
      if (input?.classTypeId) query = query.eq('class_type_id', input.classTypeId);
      if (input?.levelId) query = query.eq('level_id', input.levelId);
      if (input?.dayOfWeek !== undefined) query = query.eq('day_of_week', input.dayOfWeek);

      const { data, error } = await query.order('day_of_week').order('start_time');
      if (error) throw error;
      return data ?? [];
    }),

  getClass: studioProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('classes')
        .select(
          '*, class_types(*), levels(*), seasons(*), staff(display_name)'
        )
        .eq('id', input.classId)
        .eq('studio_id', ctx.studioId)
        .eq('is_public', true)
        .single();

      if (error) throw error;
      return data;
    }),

  getSeasons: studioProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }),

  getClassTypes: studioProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('class_types')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('sort_order');

    if (error) throw error;
    return data ?? [];
  }),

  getLevels: studioProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('levels')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('active', true)
      .order('sort_order');

    if (error) throw error;
    return data ?? [];
  }),

  getStudio: studioProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from('studios')
      .select('id, name, slug, logo_url, primary_color, secondary_color, phone, email, website, address_line1, city, state, zip')
      .eq('id', ctx.studioId)
      .single();

    if (error) throw error;
    return data;
  }),
});
