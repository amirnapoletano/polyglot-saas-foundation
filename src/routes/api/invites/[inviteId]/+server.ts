import { error, json } from '@sveltejs/kit';
import { logActivity } from '$lib/server/audit';

export const DELETE = async ({ params, locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const inviteId = params.inviteId;
	if (!inviteId) {
		throw error(400, 'Missing invite id');
	}

	// Get current user's organization
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

	// Check permissions
	const { data: membership, error: membershipError } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (membershipError) {
		throw error(500, membershipError.message);
	}

	if (!membership || !membership.role || !['owner', 'admin'].includes(membership.role)) {
		throw error(403, 'Not allowed to cancel invites');
	}

	// Verify invite exists
	const { data: invite, error: inviteLookupError } = await locals.supabase
		.from('org_invites')
		.select('id')
		.eq('id', inviteId)
		.eq('organization_id', orgId)
		.is('accepted_at', null)
		.maybeSingle();

	if (inviteLookupError) {
		throw error(500, inviteLookupError.message);
	}

	if (!invite) {
		throw error(404, 'Invite not found');
	}

	// Delete invite
	const { error: deleteError } = await locals.supabase
		.from('org_invites')
		.delete()
		.eq('id', inviteId)
		.eq('organization_id', orgId);

	if (deleteError) {
		throw error(500, deleteError.message);
	}

	await logActivity(locals.supabase, {
		organizationId: orgId,
		actorUserId: user.id,
		action: 'invite.cancelled',
		resourceType: 'invite',
		resourceId: inviteId
	});

	return json({ ok: true });
};
