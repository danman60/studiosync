import { createServiceClient } from './supabase-server';

const DEV_STUDIO_ID = '11111111-1111-1111-1111-111111111111';

export function getStudioId(studioSlug: string | null): string | null {
  // In dev without subdomain, use the seed studio
  if (!studioSlug && process.env.NODE_ENV === 'development') {
    return DEV_STUDIO_ID;
  }
  return null; // Will be resolved from slug
}

export async function fetchCatalogData(studioSlug: string | null) {
  const supabase = createServiceClient();

  // Resolve studio
  let studioId: string | null = null;
  if (studioSlug) {
    const { data } = await supabase
      .from('studios')
      .select('id')
      .eq('slug', studioSlug)
      .single();
    studioId = data?.id ?? null;
  }

  // Dev fallback
  if (!studioId && process.env.NODE_ENV === 'development') {
    studioId = DEV_STUDIO_ID;
  }

  if (!studioId) return null;

  const [classesRes, typesRes, levelsRes, seasonsRes, studioRes] = await Promise.all([
    supabase
      .from('classes')
      .select('*, class_types(*), levels(*), seasons(*), staff(display_name)')
      .eq('studio_id', studioId)
      .eq('is_public', true)
      .order('day_of_week')
      .order('start_time'),
    supabase
      .from('class_types')
      .select('*')
      .eq('studio_id', studioId)
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('levels')
      .select('*')
      .eq('studio_id', studioId)
      .eq('active', true)
      .order('sort_order'),
    supabase
      .from('seasons')
      .select('*')
      .eq('studio_id', studioId)
      .eq('is_current', true)
      .single(),
    supabase
      .from('studios')
      .select('id, name, slug, primary_color, secondary_color, phone, email')
      .eq('id', studioId)
      .single(),
  ]);

  return {
    classes: classesRes.data ?? [],
    classTypes: typesRes.data ?? [],
    levels: levelsRes.data ?? [],
    currentSeason: seasonsRes.data,
    studio: studioRes.data,
  };
}

export async function fetchClassDetail(classId: string, studioSlug: string | null) {
  const supabase = createServiceClient();

  let studioId: string | null = null;
  if (studioSlug) {
    const { data } = await supabase
      .from('studios')
      .select('id')
      .eq('slug', studioSlug)
      .single();
    studioId = data?.id ?? null;
  }
  if (!studioId && process.env.NODE_ENV === 'development') {
    studioId = DEV_STUDIO_ID;
  }
  if (!studioId) return null;

  const { data } = await supabase
    .from('classes')
    .select('*, class_types(*), levels(*), seasons(*), staff(display_name)')
    .eq('id', classId)
    .eq('studio_id', studioId)
    .eq('is_public', true)
    .single();

  return data;
}
