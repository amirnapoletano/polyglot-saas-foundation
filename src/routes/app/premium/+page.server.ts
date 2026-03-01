import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent();
  const org = parentData?.org ?? null;
  const orgId = org?.id ?? null;

  if (!orgId) {
    throw redirect(303, '/app'); // or wherever org is selected/created
  }

  const { data: billing, error } = await locals.supabase
    .from('org_billing')
    .select('status, price_id, current_period_end, cancel_at_period_end')
    .eq('organization_id', orgId)
    .maybeSingle();

  // Never hard-fail the page because billing isn't ready yet
  if (error) {
    return {
      org,
      billing: null,
      isActive: false
    };
  }

  const status = billing?.status ?? null;

  // Strict: only active/trialing
  const isActive = status === 'active' || status === 'trialing';

  return {
    org,
    billing: billing ?? null,
    isActive
  };
};