import { error, json } from '@sveltejs/kit';

export const POST = async ({ request, locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json().catch(() => null);
  const organizationId = body?.organizationId?.trim?.();

  if (!organizationId) {
    throw error(400, 'Organization id is required');
  }

  const { data: membership, error: membershipError } = await locals.supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    throw error(500, membershipError.message);
  }

  if (!membership) {
    throw error(403, 'You are not a member of this organization');
  }

  const { error: updateError } = await locals.supabase
    .from('profiles')
    .update({ active_org_id: organizationId })
    .eq('id', user.id);

  if (updateError) {
    throw error(500, updateError.message);
  }

  return json({ ok: true });
};