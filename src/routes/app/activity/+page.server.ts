import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 25;

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const parentData = await parent();
	const orgId = parentData.activeOrgId;
	if (!orgId) throw redirect(303, '/onboarding');

	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
	const from = (page - 1) * PAGE_SIZE;
	const to = from + PAGE_SIZE - 1;

	// Get total count
	const { count, error: countError } = await locals.supabase
		.from('audit_log')
		.select('id', { count: 'exact', head: true })
		.eq('organization_id', orgId);

	if (countError) {
		if (
			countError.code === '42P01' ||
			countError.message?.includes('does not exist') ||
			countError.message?.includes('schema cache')
		) {
			return { logs: [], actorProfiles: {}, page: 1, totalPages: 1 };
		}
		throw error(500, countError.message);
	}

	const totalCount = count ?? 0;
	const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

	const { data: logs, error: logsError } = await locals.supabase
		.from('audit_log')
		.select('id, action, actor_user_id, resource_type, resource_id, metadata, created_at')
		.eq('organization_id', orgId)
		.order('created_at', { ascending: false })
		.range(from, to);

	if (logsError) {
		if (
			logsError.code === '42P01' ||
			logsError.message?.includes('does not exist') ||
			logsError.message?.includes('schema cache')
		) {
			return { logs: [], actorProfiles: {}, page: 1, totalPages: 1 };
		}
		throw error(500, logsError.message);
	}

	// Load actor profiles
	const actorIds = [
		...new Set((logs ?? []).map((l) => l.actor_user_id).filter((id): id is string => id != null))
	];
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

	return { logs: logs ?? [], actorProfiles, page, totalPages };
};
