import type { PageServerLoad } from './$types';
import { error as kitError } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent();
  const orgId = parentData?.org?.id;

  if (!orgId) throw kitError(500, 'Missing org id');

  const { data: org, error } = await locals.supabase
    .from('organizations')
    .select('id, name, created_at')
    .eq('id', orgId)
    .single();

  if (error) throw kitError(500, error.message);

  return { org };
};