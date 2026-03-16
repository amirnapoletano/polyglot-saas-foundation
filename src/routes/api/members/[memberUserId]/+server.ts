

import { error, json } from '@sveltejs/kit';

export const DELETE = async ({ params, locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, 'Unauthorized');
  }

  const targetUserId = params.memberUserId;
  if (!targetUserId) {
    throw error(400, 'Missing member user id');
  }

  // Get current user's active organization
  const { data: profile, error: profileError } = await locals.supabase
    .from('profiles')
    .select('active_org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw error(500, profileError.message);
  }

  const orgId = profile?.active_org_id;
  if (!orgId) {
    throw error(400, 'No active organization');
  }

  // Check current user's role
  const { data: currentMembership, error: currentMembershipError } =
    await locals.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', user.id)
      .maybeSingle();

  if (currentMembershipError) {
    throw error(500, currentMembershipError.message);
  }

  if (!currentMembership || !['owner', 'admin'].includes(currentMembership.role)) {
    throw error(403, 'Not allowed to remove members');
  }

  // Prevent removing yourself
  if (targetUserId === user.id) {
    throw error(400, 'You cannot remove yourself');
  }

  // Check target membership
  const { data: targetMembership, error: targetMembershipError } =
    await locals.supabase
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', targetUserId)
      .maybeSingle();

  if (targetMembershipError) {
    throw error(500, targetMembershipError.message);
  }

  if (!targetMembership) {
    throw error(404, 'Member not found');
  }

  // Prevent removing the last owner
  if (targetMembership.role === 'owner') {
    const { count, error: ownerCountError } = await locals.supabase
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('role', 'owner');

    if (ownerCountError) {
      throw error(500, ownerCountError.message);
    }

    if ((count ?? 0) <= 1) {
      throw error(400, 'You cannot remove the last owner');
    }
  }

  // Remove membership
  const { error: deleteError } = await locals.supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('user_id', targetUserId);

  if (deleteError) {
    throw error(500, deleteError.message);
  }

  // If the removed user had this org as active_org_id, clear it
  const { data: targetProfile } = await locals.supabase
    .from('profiles')
    .select('active_org_id')
    .eq('id', targetUserId)
    .maybeSingle();

  if (targetProfile?.active_org_id === orgId) {
    await locals.supabase
      .from('profiles')
      .update({ active_org_id: null })
      .eq('id', targetUserId);
  }

  return json({ ok: true });
};