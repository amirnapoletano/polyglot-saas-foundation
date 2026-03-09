import { redirect, error } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

export const load = async ({ params, locals, url }) => {
  const token = params.token;

  if (!token) {
    throw error(400, 'Missing invite token');
  }

  const supabaseAdmin = createClient(
    PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );

  const { data: invite, error: inviteError } = await supabaseAdmin
    .from('org_invites')
    .select('id, organization_id, email, role, token, expires_at, accepted_at')
    .eq('token', token)
    .maybeSingle();

  if (inviteError) {
    throw error(500, inviteError.message);
  }

  if (!invite) {
    throw error(404, 'Invite not found');
  }

  if (invite.accepted_at) {
    return {
      status: 'accepted',
      invite
    };
  }

  const expiresAt = invite.expires_at ? new Date(invite.expires_at) : null;
  if (expiresAt && expiresAt.getTime() < Date.now()) {
    return {
      status: 'expired',
      invite
    };
  }

  const { session, user } = await locals.safeGetSession();

  if (!session || !user) {
    const next = encodeURIComponent(url.pathname);
    throw redirect(303, `/login?next=${next}`);
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id, email, active_org_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    throw error(500, profileError.message);
  }

  if (!profile) {
    throw error(404, 'Profile not found');
  }

  const userEmail = profile.email?.trim().toLowerCase();
  const inviteEmail = invite.email?.trim().toLowerCase();

  if (!userEmail || userEmail !== inviteEmail) {
    return {
      status: 'wrong-account',
      invite
    };
  }

  const { data: existingMembership, error: existingMembershipError } = await supabaseAdmin
    .from('organization_members')
    .select('id')
    .eq('organization_id', invite.organization_id)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existingMembershipError) {
    throw error(500, existingMembershipError.message);
  }

  if (!existingMembership) {
    const { error: insertMembershipError } = await supabaseAdmin
      .from('organization_members')
      .insert({
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role || 'member'
      });

    if (insertMembershipError) {
      throw error(500, insertMembershipError.message);
    }
  }

  const { error: acceptInviteError } = await supabaseAdmin
    .from('org_invites')
    .update({
      accepted_at: new Date().toISOString()
    })
    .eq('id', invite.id);

  if (acceptInviteError) {
    throw error(500, acceptInviteError.message);
  }

  const { error: updateProfileError } = await supabaseAdmin
    .from('profiles')
    .update({
      active_org_id: invite.organization_id
    })
    .eq('id', user.id);

  if (updateProfileError) {
    throw error(500, updateProfileError.message);
  }

  throw redirect(303, '/app/members');
};