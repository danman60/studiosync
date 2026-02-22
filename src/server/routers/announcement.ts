import { z } from 'zod';
import { adminProcedure, protectedProcedure, instructorProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';
import { sendNotification } from '@/lib/notifications';

export const announcementRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  list: adminProcedure
    .input(z.object({
      draftsOnly: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('announcements')
        .select('*, staff(display_name)')
        .eq('studio_id', ctx.studioId);

      if (input?.draftsOnly) query = query.eq('is_draft', true);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return data ?? [];
    }),

  create: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(200),
      body: z.string().min(1).max(10000),
      target_type: z.enum(['all', 'class', 'level', 'class_type']).default('all'),
      target_id: z.string().uuid().optional(),
      publish: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('announcements')
        .insert({
          studio_id: ctx.studioId,
          author_id: ctx.staffId ?? null,
          title: input.title,
          body: input.body,
          target_type: input.target_type,
          target_id: input.target_id ?? null,
          is_draft: !input.publish,
          published_at: input.publish ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  update: adminProcedure
    .input(z.object({
      id: z.string().uuid(),
      title: z.string().min(1).max(200).optional(),
      body: z.string().min(1).max(10000).optional(),
      target_type: z.enum(['all', 'class', 'level', 'class_type']).optional(),
      target_id: z.string().uuid().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('announcements')
        .update(updates)
        .eq('id', id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  publish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('announcements')
        .update({ is_draft: false, published_at: new Date().toISOString() })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;

      // Notify families based on targeting (non-blocking)
      if (data) {
        let familyQuery = supabase
          .from('families')
          .select('id, email, parent_first_name')
          .eq('studio_id', ctx.studioId);

        // For class-targeted announcements, only notify enrolled families
        if (data.target_type === 'class' && data.target_id) {
          const { data: enrollments } = await supabase
            .from('enrollments')
            .select('family_id')
            .eq('class_id', data.target_id)
            .eq('studio_id', ctx.studioId)
            .in('status', ['active', 'pending']);

          const familyIds = [...new Set(enrollments?.map(e => e.family_id) ?? [])];
          if (familyIds.length > 0) {
            familyQuery = familyQuery.in('id', familyIds);
          }
        }

        const { data: families } = await familyQuery;
        for (const fam of families ?? []) {
          sendNotification({
            studioId: ctx.studioId,
            familyId: fam.id,
            type: 'announcement',
            subject: `New Announcement: ${data.title}`,
            body: data.body.substring(0, 200),
            recipientEmail: fam.email,
          });
        }
      }

      return data;
    }),

  unpublish: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('announcements')
        .update({ is_draft: true, published_at: null })
        .eq('id', input.id)
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
        .from('announcements')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  // ═══════════════════════════════════════════════════════
  // FEED PROCEDURES (Parent + Instructor)
  // ═══════════════════════════════════════════════════════

  /** Parent feed: published announcements targeting 'all' or their enrolled classes/types/levels */
  parentFeed: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    // Get "all" announcements
    const { data: allAnnouncements } = await supabase
      .from('announcements')
      .select('*, staff(display_name)')
      .eq('studio_id', ctx.studioId)
      .eq('is_draft', false)
      .eq('target_type', 'all')
      .order('published_at', { ascending: false })
      .limit(20);

    // Get class-targeted announcements for enrolled classes
    let classAnnouncements: typeof allAnnouncements = [];
    if (ctx.familyId) {
      const { data: enrollments } = await supabase
        .from('enrollments')
        .select('class_id, classes(class_type_id, level_id)')
        .eq('family_id', ctx.familyId)
        .eq('studio_id', ctx.studioId)
        .in('status', ['active', 'pending']);

      const classIds = (enrollments ?? []).map((e) => e.class_id);
      const classTypeIds = [...new Set((enrollments ?? []).map((e) => (e.classes as unknown as { class_type_id: string })?.class_type_id).filter(Boolean))];
      const levelIds = [...new Set((enrollments ?? []).map((e) => (e.classes as unknown as { level_id: string | null })?.level_id).filter(Boolean))];

      if (classIds.length > 0) {
        const { data } = await supabase
          .from('announcements')
          .select('*, staff(display_name)')
          .eq('studio_id', ctx.studioId)
          .eq('is_draft', false)
          .eq('target_type', 'class')
          .in('target_id', classIds)
          .order('published_at', { ascending: false })
          .limit(20);
        classAnnouncements = data ?? [];
      }

      // Class type targeted
      if (classTypeIds.length > 0) {
        const { data } = await supabase
          .from('announcements')
          .select('*, staff(display_name)')
          .eq('studio_id', ctx.studioId)
          .eq('is_draft', false)
          .eq('target_type', 'class_type')
          .in('target_id', classTypeIds as string[])
          .order('published_at', { ascending: false })
          .limit(20);
        classAnnouncements = [...(classAnnouncements ?? []), ...(data ?? [])];
      }

      // Level targeted
      if (levelIds.length > 0) {
        const { data } = await supabase
          .from('announcements')
          .select('*, staff(display_name)')
          .eq('studio_id', ctx.studioId)
          .eq('is_draft', false)
          .eq('target_type', 'level')
          .in('target_id', levelIds as string[])
          .order('published_at', { ascending: false })
          .limit(20);
        classAnnouncements = [...(classAnnouncements ?? []), ...(data ?? [])];
      }
    }

    // Merge, dedupe, sort by published_at
    const all = [...(allAnnouncements ?? []), ...(classAnnouncements ?? [])];
    const seen = new Set<string>();
    const unique = all.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    unique.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));

    return unique.slice(0, 30);
  }),

  /** Instructor feed: published announcements targeting 'all' or their classes */
  instructorFeed: instructorProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    const { data: allAnnouncements } = await supabase
      .from('announcements')
      .select('*, staff(display_name)')
      .eq('studio_id', ctx.studioId)
      .eq('is_draft', false)
      .eq('target_type', 'all')
      .order('published_at', { ascending: false })
      .limit(20);

    // Get announcements for instructor's classes
    let classQuery = supabase
      .from('classes')
      .select('id, class_type_id, level_id')
      .eq('studio_id', ctx.studioId);

    if (ctx.userRole === 'instructor') {
      classQuery = classQuery.eq('instructor_id', ctx.staffId);
    }

    const { data: classes } = await classQuery;
    const classIds = (classes ?? []).map((c) => c.id);

    let classAnnouncements: typeof allAnnouncements = [];
    if (classIds.length > 0) {
      const { data } = await supabase
        .from('announcements')
        .select('*, staff(display_name)')
        .eq('studio_id', ctx.studioId)
        .eq('is_draft', false)
        .eq('target_type', 'class')
        .in('target_id', classIds)
        .order('published_at', { ascending: false })
        .limit(20);
      classAnnouncements = data ?? [];
    }

    const all = [...(allAnnouncements ?? []), ...(classAnnouncements ?? [])];
    const seen = new Set<string>();
    const unique = all.filter((a) => {
      if (seen.has(a.id)) return false;
      seen.add(a.id);
      return true;
    });
    unique.sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));

    return unique.slice(0, 30);
  }),
});
