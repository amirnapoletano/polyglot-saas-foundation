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

  const { data: memberships, error: membershipsError } = await locals.supabase
    .from('organization_members')
    .select('organization_id, role, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  if (membershipsError) throw kitError(500, membershipsError.message);

  if (!memberships || memberships.length === 0) {
    throw redirect(303, '/onboarding');
  }

  const organizationIds = memberships.map((item) => item.organization_id);
  const validOrganizationIds = new Set(organizationIds);

  let activeOrgId = profile.active_org_id;

  if (!activeOrgId || !validOrganizationIds.has(activeOrgId)) {
    activeOrgId = organizationIds[0];

    const { error: updateProfileError } = await locals.supabase
      .from('profiles')
      .update({ active_org_id: activeOrgId })
      .eq('id', user.id);

    if (updateProfileError) throw kitError(500, updateProfileError.message);
  }

  const activeMembership = memberships.find((item) => item.organization_id === activeOrgId);

  if (!activeMembership) {
    throw kitError(403, 'Not a member of this organization');
  }

  const { data: orgRows, error: orgRowsError } = await locals.supabase
    .from('organizations')
    .select('id, name')
    .in('id', organizationIds);

  if (orgRowsError) throw kitError(500, orgRowsError.message);

  const orgMap = Object.fromEntries(
    (orgRows ?? []).map((org) => [
      org.id,
      {
        id: org.id,
        name: org.name
      }
    ])
  );

  const organizations = memberships.map((item) => ({
    organization_id: item.organization_id,
    role: item.role,
    organization: orgMap[item.organization_id] ?? null
  }));

  const { billing, isActive, plan } = await getOrgBilling(locals, activeOrgId);

  return {
    user,
    profile: {
      ...profile,
      active_org_id: activeOrgId
    },
    org: {
      id: activeOrgId,
      role: activeMembership.role
    },
    billing,
    isActive,
    plan,
    activeOrgId,
    organizations
  };
};