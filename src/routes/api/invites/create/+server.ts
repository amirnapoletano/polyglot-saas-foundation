import { json, error } from '@sveltejs/kit';
import crypto from 'crypto';
import { getOrgBilling } from '$lib/server/billing';
import { getSeatLimitFromPlan } from '$lib/server/team-limits';
import { logActivity } from '$lib/server/audit';

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

  const billingState = await getOrgBilling(locals, orgId);
  const seatLimit = getSeatLimitFromPlan(billingState.plan);

  const { count: memberCount, error: memberCountError } = await locals.supabase
    .from('organization_members')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);

  if (memberCountError) {
    console.error('invite: member count error', memberCountError);
    throw error(500, memberCountError.message);
  }

  const { count: pendingInviteCount, error: pendingInviteCountError } = await locals.supabase
    .from('org_invites')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('accepted_at', null);

  if (pendingInviteCountError) {
    console.error('invite: pending invite count error', pendingInviteCountError);
    throw error(500, pendingInviteCountError.message);
  }

  const usedSeats = (memberCount ?? 0) + (pendingInviteCount ?? 0);

  if (usedSeats >= seatLimit) {
    throw error(400, `Seat limit reached for the ${billingState.plan} plan (${seatLimit} seats).`);
  }

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

  if (!membership || !membership.role || !['owner', 'admin'].includes(membership.role)) {
    throw error(403, 'Not allowed to invite members');
  }

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
    throw error(400, 'User already invited');
  }

  const { data: matchingProfiles, error: matchingProfilesError } = await locals.supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .limit(1);

  if (matchingProfilesError) {
    console.error('invite: matching profile lookup error', matchingProfilesError);
    throw error(500, matchingProfilesError.message);
  }

  const existingUserId = matchingProfiles?.[0]?.id;

  if (existingUserId) {
    const { data: existingMember, error: existingMemberError } = await locals.supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgId)
      .eq('user_id', existingUserId)
      .maybeSingle();

    if (existingMemberError) {
      console.error('invite: existing member lookup error', existingMemberError);
      throw error(500, existingMemberError.message);
    }

    if (existingMember) {
      throw error(400, 'User is already a member of this organization');
    }
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

  await logActivity(locals.supabase, {
    organizationId: orgId,
    actorUserId: user.id,
    action: 'member.invited',
    resourceType: 'invite',
    metadata: { email, role }
  });

  return json({
    invite_link: `/invite/${token}`
  });
};