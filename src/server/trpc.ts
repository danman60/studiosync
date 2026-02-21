import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { createServiceClient } from '@/lib/supabase-server';
import type { StaffRole } from '@/types/database';

export interface TRPCContext {
  studioId: string | null;
  studioSlug: string | null;
  userId: string | null;
  userRole: StaffRole | null;
  familyId: string | null;
}

export async function createContext(opts: {
  headers: Headers;
}): Promise<TRPCContext> {
  const studioSlug = opts.headers.get('x-studio-slug');
  const authHeader = opts.headers.get('authorization');
  const supabase = createServiceClient();

  // Resolve slug → studioId
  let studioId: string | null = null;
  if (studioSlug) {
    const { data } = await supabase
      .from('studios')
      .select('id')
      .eq('slug', studioSlug)
      .single();
    studioId = data?.id ?? null;
  }

  if (!authHeader) {
    return { studioId, studioSlug, userId: null, userRole: null, familyId: null };
  }

  const token = authHeader.replace('Bearer ', '');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { studioId, studioSlug, userId: null, userRole: null, familyId: null };
  }

  let userRole: StaffRole | null = null;
  let familyId: string | null = null;

  if (studioId) {
    const { data: staff } = await supabase
      .from('staff')
      .select('role')
      .eq('studio_id', studioId)
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single();

    const { data: family } = await supabase
      .from('families')
      .select('id')
      .eq('studio_id', studioId)
      .eq('auth_user_id', user.id)
      .single();

    userRole = (staff?.role as StaffRole) ?? null;
    familyId = family?.id ?? null;
  }

  return {
    studioId,
    studioSlug,
    userId: user.id,
    userRole,
    familyId,
  };
}

const t = initTRPC.context<TRPCContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;

const requireStudio = t.middleware(({ ctx, next }) => {
  if (!ctx.studioId) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Studio context required. Use a studio subdomain.',
    });
  }
  return next({ ctx: { ...ctx, studioId: ctx.studioId } });
});

const requireAuth = t.middleware(({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not authenticated' });
  }
  if (!ctx.studioId) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Studio context required.' });
  }
  return next({ ctx: { ...ctx, userId: ctx.userId, studioId: ctx.studioId } });
});

const requireAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.studioId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (!ctx.userRole || !['owner', 'admin'].includes(ctx.userRole)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Admin access required' });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId, studioId: ctx.studioId, userRole: ctx.userRole },
  });
});

const requireOwner = t.middleware(({ ctx, next }) => {
  if (!ctx.userId || !ctx.studioId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  if (ctx.userRole !== 'owner') {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'Owner access required' });
  }
  return next({
    ctx: { ...ctx, userId: ctx.userId, studioId: ctx.studioId, userRole: ctx.userRole as 'owner' },
  });
});

export const studioProcedure = publicProcedure.use(requireStudio);
export const protectedProcedure = publicProcedure.use(requireAuth);
export const adminProcedure = publicProcedure.use(requireAdmin);
export const ownerProcedure = publicProcedure.use(requireOwner);
