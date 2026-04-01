import { redirect, error } from '@sveltejs/kit';
import { getOrgBilling } from '$lib/server/billing';
import { getSeatLimitFromPlan } from '$lib/server/team-limits';
export const load = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();

	if (!session || !user) throw redirect(302, '/login');

	const { data: profile, error: profileError } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	if (profileError) throw error(500, profileError.message);

	const orgId = profile?.active_org_id;
	if (!orgId) throw redirect(302, '/onboarding');

	const { data: membership, error: membershipError } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', orgId)
		.eq('user_id', user.id)
		.maybeSingle();

	if (membershipError) throw error(500, membershipError.message);
	if (!membership) throw error(403, 'Not a member of this organization');

	const { data: members, error: membersError } = await locals.supabase
		.from('organization_members')
		.select('id, organization_id, user_id, role, created_at')
		.eq('organization_id', orgId)
		.order('created_at', { ascending: true });

	if (membersError) throw error(500, membersError.message);

	const memberIds = (members ?? [])
		.map((member) => member.user_id)
		.filter((id): id is string => id != null);

	let memberProfiles: Array<{
		id: string;
		email: string | null;
		display_name: string | null;
	}> = [];

	let profilesById: Record<string, { email: string | null; display_name: string | null }> = {};

	if (memberIds.length > 0) {
		const { data, error: memberProfilesError } = await locals.supabase
			.from('profiles')
			.select('id, email, display_name')
			.in('id', memberIds);

		if (memberProfilesError) throw error(500, memberProfilesError.message);

		memberProfiles = data ?? [];

		profilesById = Object.fromEntries(
			memberProfiles.map((profile) => [
				profile.id,
				{
					email: profile.email ?? null,
					display_name: profile.display_name ?? null
				}
			])
		);
	}

	const normalizedMembers = (members ?? []).map((member) => ({
		id: member.id,
		user_id: member.user_id,
		role: member.role,
		created_at: member.created_at,
		profile: (member.user_id ? profilesById[member.user_id] : null) ?? {
			email: null,
			display_name: null
		}
	}));

	const { data: invites, error: invitesError } = await locals.supabase
		.from('org_invites')
		.select('id, email, role, token, expires_at, created_at, accepted_at')
		.eq('organization_id', orgId)
		.is('accepted_at', null)
		.order('created_at', { ascending: false });

	if (invitesError) throw error(500, invitesError.message);

	const billingState = await getOrgBilling(locals, orgId);
	const seatLimit = getSeatLimitFromPlan(billingState.plan);
	const usedSeats = (members ?? []).length + (invites ?? []).length;
	return {
		orgId,
		currentUserRole: membership.role,
		members: normalizedMembers,
		invites: invites ?? [],
		seatLimit,
		usedSeats
	};
};
