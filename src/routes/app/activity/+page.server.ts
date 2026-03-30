import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const orgId = parentData.activeOrgId;
	if (!orgId) throw redirect(303, '/onboarding');

	const { data: logs, error: logsError } = await locals.supabase
		.from('audit_log')
		.select('id, action, actor_user_id, resource_type, resource_id, metadata, created_at')
		.eq('organization_id', orgId)
		.order('created_at', { ascending: false })
		.limit(50);

	if (logsError) {
		// Table may not exist yet
		if (logsError.code === '42P01' || logsError.message?.includes('does not exist') || logsError.message?.includes('schema cache')) {
			return { logs: [], actorProfiles: {} };
		}
		throw error(500, logsError.message);
	}

	// Load actor profiles
	const actorIds = [...new Set((logs ?? []).map((l) => l.actor_user_id).filter((id): id is string => id != null))];
	let actorProfiles: Record<string, { email: string | null; display_name: string | null }> = {};

	if (actorIds.length > 0) {
		const { data: profiles } = await locals.supabase
			.from('profiles')
			.select('id, email, display_name')
			.in('id', actorIds);

		actorProfiles = Object.fromEntries(
			(profiles ?? []).map((p) => [p.id, { email: p.email, display_name: p.display_name }])
		);
	}

	return { logs: logs ?? [], actorProfiles };
};
