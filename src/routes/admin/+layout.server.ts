import { redirect, error as kitError } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, '/login');

	const { data: profile, error } = await locals.supabase
		.from('profiles')
		.select('id, email, display_name, is_super_admin')
		.eq('id', user.id)
		.single();

	if (error || !profile) throw kitError(403, 'Forbidden');
	if (!profile.is_super_admin) throw kitError(403, 'Forbidden');

	return { adminUser: profile };
};
