import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { getOrgBilling } from '$lib/server/billing';

export const load: PageServerLoad = async ({ parent, locals }) => {
  const parentData = await parent();
  const org = parentData?.org ?? null;
  const orgId = org?.id ?? null;

  if (!orgId) throw redirect(303, '/app');

  const { billing, isActive, plan } = await getOrgBilling(locals, orgId);

  return {
    org,
    billing,
    isActive,
    plan
  };
};