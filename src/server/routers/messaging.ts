import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { adminProcedure, protectedProcedure, router } from '../trpc';
import { createServiceClient } from '@/lib/supabase-server';

export const messagingRouter = router({
  // ── Admin: List conversations (families with messages) ──

  adminConversations: adminProcedure.query(async ({ ctx }) => {
    const supabase = createServiceClient();

    // Get distinct families that have messages, with latest message
    const { data, error } = await supabase
      .from('messages')
      .select('family_id, body, sender_type, is_read, created_at, families(parent_first_name, parent_last_name, email)')
      .eq('studio_id', ctx.studioId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Group by family, take first (latest) message per family
    const seen = new Map<string, (typeof data)[number]>();
    const unreadCounts = new Map<string, number>();
    for (const msg of data ?? []) {
      if (!seen.has(msg.family_id)) {
        seen.set(msg.family_id, msg);
      }
      if (!msg.is_read && msg.sender_type === 'parent') {
        unreadCounts.set(msg.family_id, (unreadCounts.get(msg.family_id) ?? 0) + 1);
      }
    }

    return Array.from(seen.entries()).map(([familyId, msg]) => ({
      familyId,
      lastMessage: msg.body,
      lastSenderType: msg.sender_type,
      lastMessageAt: msg.created_at,
      unreadCount: unreadCounts.get(familyId) ?? 0,
      family: msg.families as unknown as { parent_first_name: string; parent_last_name: string; email: string },
    }));
  }),

  // ── Admin: Get messages for a family ────────────────────

  adminMessages: adminProcedure
    .input(z.object({ familyId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      // Mark parent messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('studio_id', ctx.studioId)
        .eq('family_id', input.familyId)
        .eq('sender_type', 'parent')
        .eq('is_read', false);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('studio_id', ctx.studioId)
        .eq('family_id', input.familyId)
        .order('created_at', { ascending: true })
        .limit(200);

      if (error) throw error;
      return data ?? [];
    }),

  // ── Admin: Send message to family ──────────────────────

  adminSend: adminProcedure
    .input(z.object({
      familyId: z.string().uuid(),
      body: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          studio_id: ctx.studioId,
          family_id: input.familyId,
          sender_type: 'admin',
          sender_id: ctx.userId,
          body: input.body,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Parent: My messages ────────────────────────────────

  myMessages: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.familyId) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No family account found' });
    }

    const supabase = createServiceClient();

    // Mark admin messages as read
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .eq('sender_type', 'admin')
      .eq('is_read', false);

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) throw error;
    return data ?? [];
  }),

  // ── Parent: Send message ───────────────────────────────

  parentSend: protectedProcedure
    .input(z.object({
      body: z.string().min(1).max(5000),
    }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.familyId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No family account found' });
      }

      const supabase = createServiceClient();

      const { data, error } = await supabase
        .from('messages')
        .insert({
          studio_id: ctx.studioId,
          family_id: ctx.familyId,
          sender_type: 'parent',
          sender_id: ctx.userId,
          body: input.body,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }),

  // ── Parent: Unread count ───────────────────────────────

  unreadCount: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.familyId) return { count: 0 };

    const supabase = createServiceClient();
    const { count } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('studio_id', ctx.studioId)
      .eq('family_id', ctx.familyId)
      .eq('sender_type', 'admin')
      .eq('is_read', false);

    return { count: count ?? 0 };
  }),
});
