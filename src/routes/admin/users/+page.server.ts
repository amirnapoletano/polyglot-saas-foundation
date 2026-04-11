import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1'));
	const perPage = 25;
	const search = url.searchParams.get('q') ?? '';

	let query = locals.supabase
		.from('profiles')
		.select('id, email, display_name, plan, is_super_admin, created_at', { count: 'exact' })
		.order('created_at', { ascending: false })
		.range((page - 1) * perPage, page * perPage - 1);

	if (search) {
		query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`);
	}

	const { data: users, count } = await query;

	return {
		users: users ?? [],
		totalUsers: count ?? 0,
		page,
		totalPages: Math.ceil((count ?? 0) / perPage),
		search
	};
};
