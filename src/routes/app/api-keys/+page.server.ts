import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

const PAGE_SIZE = 20;

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const parentData = await parent();
	const orgId = parentData.activeOrgId;
	if (!orgId) throw redirect(303, '/onboarding');

	const isPro = parentData.plan === 'pro';
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);

	let keys: {
		id: string;
		name: string;
		key_prefix: string;
		scopes: string[] | null;
		last_used_at: string | null;
		expires_at: string | null;
		created_at: string | null;
	}[] = [];
	let totalPages = 1;

	if (isPro) {
		const { count } = await locals.supabase
			.from('api_keys')
			.select('id', { count: 'exact', head: true })
			.eq('organization_id', orgId)
			.is('revoked_at', null);

		const totalCount = count ?? 0;
		totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

		const from = (page - 1) * PAGE_SIZE;
		const to = from + PAGE_SIZE - 1;

		const { data, error: keysError } = await locals.supabase
			.from('api_keys')
			.select('id, name, key_prefix, scopes, last_used_at, expires_at, created_at')
			.eq('organization_id', orgId)
			.is('revoked_at', null)
			.order('created_at', { ascending: false })
			.range(from, to);

		if (keysError) throw error(500, keysError.message);
		keys = data ?? [];
	}

	return { keys, isPro, currentUserRole: parentData.org?.role, page, totalPages };
};
