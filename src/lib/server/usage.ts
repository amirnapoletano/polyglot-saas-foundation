import { error } from '@sveltejs/kit';

export async function requireProjectLimit({
  locals,
  organizationId,
  plan
}: {
  locals: any;
  organizationId: string;
  plan: string;
}) {

  const { count } = await locals.supabase
    .from('projects')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId);

  if (plan === 'free' && (count ?? 0) >= 3) {
    throw error(403, 'Free plan limit reached. Upgrade to create more projects.');
  }

}