import { json, error } from '@sveltejs/kit';
import crypto from 'crypto';

export const POST = async ({ request, locals }) => {
  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    throw error(401, 'Unauthorized');
  }

  const body = await request.json().catch(() => null);
  const email = body?.email?.trim()?.toLowerCase();
  const role = body?.role?.trim?.() || 'member';

  if (!email) {
    throw error(400, 'Email is required');
  }

  // resolve active org from profile
  const { data: profile, error: profileError } = await locals.supabase
    .from('profiles')
    .select('active_org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.error('invite: profile lookup error', profileError);
    throw error(500, profileError.message);
  }

  const orgId = profile?.active_org_id;
  if (!orgId) {
    throw error(400, 'No active organization');
  }

  // make sure current user is allowed to invite
  const { data: membership, error: membershipError } = await locals.supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (membershipError) {
    console.error('invite: membership lookup error', membershipError);
    throw error(500, membershipError.message);
  }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    throw error(403, 'Not allowed to invite members');
  }

  // prevent duplicate pending invite
  const { data: existingInvite, error: existingInviteError } = await locals.supabase
    .from('org_invites')
    .select('id')
    .eq('organization_id', orgId)
    .eq('email', email)
    .is('accepted_at', null)
    .maybeSingle();
  if (existingInviteError) {
    console.error('invite: existing invite lookup error', existingInviteError);
    throw error(500, existingInviteError.message);
  }

  if (existingInvite) {
    throw error(400, 'An invite for this email already exists');
  }

  const token = crypto.randomBytes(32).toString('hex');

  const { error: inviteError } = await locals.supabase
    .from('org_invites')
    .insert({
      organization_id: orgId,
      email,
      role,
      token,
      invited_by: user.id,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    });

  if (inviteError) {
    console.error('invite: insert error', inviteError);
    throw error(500, inviteError.message);
  }

  return json({
    invite_link: `/invite/${token}`
  });
};