import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const parentData = await parent();
	const orgId = parentData.activeOrgId;
	if (!orgId) throw redirect(303, '/onboarding');

	const isPro = parentData.plan === 'pro';

	let keys: {
		id: string;
		name: string;
		key_prefix: string;
		scopes: string[] | null;
		last_used_at: string | null;
		expires_at: string | null;
		created_at: string | null;
	}[] = [];

	if (isPro) {
		const { data, error: keysError } = await locals.supabase
			.from('api_keys')
			.select('id, name, key_prefix, scopes, last_used_at, expires_at, created_at')
			.eq('organization_id', orgId)
			.is('revoked_at', null)
			.order('created_at', { ascending: false });

		if (keysError) throw error(500, keysError.message);
		keys = data ?? [];
	}

	return { keys, isPro, currentUserRole: parentData.org?.role };
};
