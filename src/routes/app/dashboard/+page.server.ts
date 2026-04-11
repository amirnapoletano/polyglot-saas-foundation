import type { PageServerLoad } from './$types';
import { error as kitError } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const parentData = await parent();
	const orgId = parentData?.org?.id;

	if (!orgId) throw kitError(500, 'Missing org id');

	const [orgResult, membersResult, invitesResult, activityResult] =
		await Promise.all([
			locals.supabase
				.from('organizations')
				.select('id, name, created_at')
				.eq('id', orgId)
				.single(),
			locals.supabase
				.from('organization_members')
				.select('id, role')
				.eq('organization_id', orgId),
			locals.supabase
				.from('org_invites')
				.select('id')
				.eq('organization_id', orgId)
				.is('accepted_at', null),
			locals.supabase
				.from('audit_log')
				.select('id, action, actor_user_id, metadata, created_at')
				.eq('organization_id', orgId)
				.order('created_at', { ascending: false })
				.limit(5)
		]);

	if (orgResult.error) throw kitError(500, orgResult.error.message);

	const members = membersResult.data ?? [];
	const actorIds = [
		...new Set(
			(activityResult.data ?? [])
				.map((e) => e.actor_user_id)
				.filter((id): id is string => id != null)
		)
	];

	let actorProfiles: Record<string, { display_name: string | null; email: string | null }> = {};
	if (actorIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('id, display_name, email')
			.in('id', actorIds);
		if (profiles) {
			actorProfiles = Object.fromEntries(profiles.map((p) => [p.id, p]));
		}
	}

	return {
		org: orgResult.data,
		memberCount: members.length,
		membersByRole: {
			owner: members.filter((m) => m.role === 'owner').length,
			admin: members.filter((m) => m.role === 'admin').length,
			member: members.filter((m) => m.role === 'member').length
		},
		pendingInvites: invitesResult.data?.length ?? 0,
		recentActivity: activityResult.data ?? [],
		actorProfiles
	};
};
