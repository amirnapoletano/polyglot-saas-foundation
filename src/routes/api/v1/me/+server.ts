import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	const orgId = locals.apiKeyOrgId;
	if (!orgId) throw error(401, 'Valid API key required');

	const { data: org } = await locals.supabase
		.from('organizations')
		.select('id, name')
		.eq('id', orgId)
		.maybeSingle();

	return json({ organization: org });
};
