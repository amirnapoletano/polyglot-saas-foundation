import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const perPage = 25;
	const search = url.searchParams.get('q') ?? '';

	let query = locals.supabase
		.from('organizations')
		.select('id, name, created_at, created_by', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (search) {
		query = query.ilike('name', `%${search}%`);
	}

	const { data: orgs, count } = await query;

	// Get member counts and billing for each org
	const orgIds = (orgs ?? []).map((o) => o.id);
	let memberCounts: Record<string, number> = {};
	let billingMap: Record<string, string> = {};

	if (orgIds.length > 0) {
		const { data: members } = await locals.supabase
			.from('organization_members')
			.select('organization_id')
			.in('organization_id', orgIds);

		if (members) {
			for (const m of members) {
				if (m.organization_id) {
					memberCounts[m.organization_id] = (memberCounts[m.organization_id] ?? 0) + 1;
				}
			}
		}

		const { data: billing } = await locals.supabase
			.from('org_billing')
			.select('organization_id, status')
			.in('organization_id', orgIds);

		if (billing) {
			for (const b of billing) {
				billingMap[b.organization_id] = b.status ?? 'none';
			}
		}
	}

	return {
		orgs: (orgs ?? []).map((o) => ({
			...o,
			memberCount: memberCounts[o.id] ?? 0,
			billingStatus: billingMap[o.id] ?? 'none'
		})),
		totalOrgs: count ?? 0,
		page,
		totalPages: Math.ceil((count ?? 0) / perPage),
		search
	};
};
