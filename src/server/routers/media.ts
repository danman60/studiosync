import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, instructorProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

const BUCKET = 'studiosync-media';

const MIME_TO_TYPE: Record<string, 'image' | 'video' | 'audio' | 'document'> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'video/mp4': 'video',
  'video/quicktime': 'video',
  'video/webm': 'video',
  'audio/mpeg': 'audio',
  'audio/wav': 'audio',
  'audio/mp4': 'audio',
  'application/pdf': 'document',
};

export const mediaRouter = router({
  // ═══════════════════════════════════════════════════════
  // ADMIN PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Get a signed upload URL for the client to PUT a file directly to storage */
  getUploadUrl: adminProcedure
    .input(z.object({
      fileName: z.string().min(1).max(500),
      mimeType: z.string().min(1),
      classId: z.string().uuid().optional(),
      title: z.string().max(200).optional(),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const ext = input.fileName.split('.').pop() ?? '';
      const storagePath = `${ctx.studioId}/${crypto.randomUUID()}.${ext}`;

      // Create signed upload URL
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET)
        .createSignedUploadUrl(storagePath);

      if (uploadError || !uploadData) {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: uploadError?.message ?? 'Failed to create upload URL' });
      }

      const mediaType = MIME_TO_TYPE[input.mimeType] ?? 'document';

      // Create media record
      const { data: media, error } = await supabase
        .from('media')
        .insert({
          studio_id: ctx.studioId,
          class_id: input.classId ?? null,
          uploaded_by: ctx.staffId ?? null,
          title: input.title ?? input.fileName,
          type: mediaType,
          storage_path: storagePath,
          file_name: input.fileName,
          mime_type: input.mimeType,
          is_public: input.isPublic ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      return {
        media,
        uploadUrl: uploadData.signedUrl,
        token: uploadData.token,
        path: storagePath,
      };
    }),

  /** Confirm upload completed (set file size) */
  confirmUpload: adminProcedure
    .input(z.object({
      mediaId: z.string().uuid(),
      fileSize: z.number().int().min(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('media')
        .update({ file_size: input.fileSize })
        .eq('id', input.mediaId)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  list: adminProcedure
    .input(z.object({
      classId: z.string().uuid().optional(),
      type: z.enum(['image', 'video', 'audio', 'document']).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      let query = supabase
        .from('media')
        .select('*, classes(name, class_types(name, color)), staff(display_name)')
        .eq('studio_id', ctx.studioId);

      if (input?.classId) query = query.eq('class_id', input.classId);
      if (input?.type) query = query.eq('type', input.type);

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;

      // Generate signed URLs for viewing
      const withUrls = await Promise.all(
        (data ?? []).map(async (m) => {
          const { data: urlData } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(m.storage_path, 3600);
          return { ...m, url: urlData?.signedUrl ?? null };
        })
      );

      return withUrls;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Get storage path
      const { data: media } = await supabase
        .from('media')
        .select('storage_path')
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .single();

      if (!media) throw new TRPCError({ code: 'NOT_FOUND' });

      // Delete from storage
      await supabase.storage.from(BUCKET).remove([media.storage_path]);

      // Delete record
      const { error } = await supabase
        .from('media')
        .delete()
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId);

      if (error) throw error;
      return { success: true };
    }),

  togglePublic: adminProcedure
    .input(z.object({ id: z.string().uuid(), isPublic: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();
      const { data, error } = await supabase
        .from('media')
        .update({ is_public: input.isPublic })
        .eq('id', input.id)
        .eq('studio_id', ctx.studioId)
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ═══════════════════════════════════════════════════════
  // INSTRUCTOR PROCEDURES
  // ═══════════════════════════════════════════════════════

  myClassMedia: instructorProcedure
    .input(z.object({ classId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Verify instructor owns this class
      if (ctx.userRole === 'instructor') {
        const { data: cls } = await supabase
          .from('classes')
          .select('instructor_id')
          .eq('id', input.classId)
          .eq('studio_id', ctx.studioId)
          .single();

        if (!cls || cls.instructor_id !== ctx.staffId) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Not your class' });
        }
      }

      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('class_id', input.classId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const withUrls = await Promise.all(
        (data ?? []).map(async (m) => {
          const { data: urlData } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(m.storage_path, 3600);
          return { ...m, url: urlData?.signedUrl ?? null };
        })
      );

      return withUrls;
    }),

  // ═══════════════════════════════════════════════════════
  // PARENT PROCEDURES
  // ═══════════════════════════════════════════════════════

  /** Media from enrolled classes that is marked as public */
  classMedia: protectedProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    if (!ctx.familyId) return [];

    // Get enrolled class IDs
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('class_id')
      .eq('family_id', ctx.familyId)
      .eq('studio_id', ctx.studioId)
      .in('status', ['active', 'pending']);

    const classIds = (enrollments ?? []).map((e) => e.class_id);
    if (classIds.length === 0) return [];

    const { data, error } = await supabase
      .from('media')
      .select('*, classes(name, class_types(name, color))')
      .eq('studio_id', ctx.studioId)
      .eq('is_public', true)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    const withUrls = await Promise.all(
      (data ?? []).map(async (m) => {
        const { data: urlData } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(m.storage_path, 3600);
        return { ...m, url: urlData?.signedUrl ?? null };
      })
    );

    return withUrls;
  }),
});
