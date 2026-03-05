import { redirect, error as kitError } from '@sveltejs/kit';
import { getOrgBilling } from '$lib/server/billing';

export const load = async ({ locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw redirect(303, '/login');
  }

  const { data: profile, error: profileError } = await locals.supabase
    .from('profiles')
    .select('id, email, display_name, plan, active_org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) throw kitError(500, profileError.message);
  if (!profile) throw kitError(500, 'Profile not found');

  if (!profile.active_org_id) {
    throw redirect(303, '/onboarding');
  }

  const { data: membership, error: membershipError } = await locals.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', profile.active_org_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) throw kitError(500, membershipError.message);
  if (!membership) throw kitError(403, 'Not a member of this organization');

  // ✅ Billing / plan (single source of truth)
  const { billing, isActive, plan } = await getOrgBilling(locals, profile.active_org_id);

  return {
    user,
    profile,
    org: {
      id: profile.active_org_id,
      role: membership.role
    },
    billing,
    isActive,
    plan
  };
};