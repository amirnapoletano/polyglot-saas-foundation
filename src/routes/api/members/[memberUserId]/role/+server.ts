import { error, json } from '@sveltejs/kit';
import { logActivity } from '$lib/server/audit';

const ALLOWED_ROLES = ['owner', 'admin', 'member'] as const;
type Role = (typeof ALLOWED_ROLES)[number];

function isRole(value: string): value is Role {
	return ALLOWED_ROLES.includes(value as Role);
}

export const PATCH = async ({ params, request, locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) {
		throw error(401, 'Unauthorized');
	}

	const targetUserId = params.memberUserId;
	if (!targetUserId) {
		throw error(400, 'Missing member user id');
	}

	const body = await request.json().catch(() => null);
	const nextRole = body?.role?.trim?.();

	if (!nextRole || !isRole(nextRole)) {
		throw error(400, 'Invalid role');
	}

	// Get organization
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
	const { data: currentMembership, error: currentMembershipError } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (currentMembershipError) {
		throw error(500, currentMembershipError.message);
	}

	if (!currentMembership || currentMembership.role !== 'owner') {
		throw error(403, 'Only owners can change roles');
	}

	// Check target membership
	const { data: targetMembership, error: targetMembershipError } = await locals.supabase
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

	// Prevent self-demotion
	if (targetUserId === user.id && nextRole !== 'owner') {
		throw error(400, 'You cannot demote yourself');
	}

	// Prevent removing last owner
	if (targetMembership.role === 'owner' && nextRole !== 'owner') {
		const { count, error: ownerCountError } = await locals.supabase
			.from('organization_members')
			.select('*', { count: 'exact', head: true })
			.eq('organization_id', orgId)
			.eq('role', 'owner');

		if (ownerCountError) {
			throw error(500, ownerCountError.message);
		}

		if ((count ?? 0) <= 1) {
			throw error(400, 'You cannot demote the last owner');
		}
	}

	const { error: updateError } = await locals.supabase
		.from('organization_members')
		.update({ role: nextRole })
		.eq('organization_id', orgId)
		.eq('user_id', targetUserId);

	if (updateError) {
		throw error(500, updateError.message);
	}

	await logActivity(locals.supabase, {
		organizationId: orgId,
		actorUserId: user.id,
		action: 'member.role_changed',
		resourceType: 'member',
		resourceId: targetUserId,
		metadata: { old_role: targetMembership.role, new_role: nextRole }
	});

	return json({ ok: true });
};
