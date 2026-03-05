import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent }) => {
  const parentData = await parent();

  const org = parentData?.org ?? null;
  const orgId = org?.id ?? null;

  if (!orgId) throw redirect(303, '/app');

  return {
    org,
    billing: parentData.billing ?? null,
    isActive: Boolean(parentData.isActive),
    plan: parentData.plan ?? 'free'
  };
};