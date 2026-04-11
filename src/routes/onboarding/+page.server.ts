import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(303, '/login');

	const { data: profile, error } = await locals.supabase
		.from('profiles')
		.select('id, email, display_name, plan, active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	if (error) return { profile: null, message: error.message };
	if (!profile) return { profile: null, message: 'Profile not found' };

	if (profile.active_org_id) throw redirect(303, '/app/dashboard');

	return { profile };
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) throw redirect(303, '/login');

		const form = await request.formData();
		const action = form.get('_action');

		if (action === 'createWorkspace') {
			const name = String(form.get('workspace_name') || '').trim();

			if (!name || name.length < 2)
				return fail(400, { message: 'Workspace name must be at least 2 characters.' });
			if (name.length > 60)
				return fail(400, { message: 'Workspace name must be under 60 characters.' });

			const displayName = String(form.get('display_name') || '').trim();
			if (displayName) {
				await locals.supabase
					.from('profiles')
					.update({ display_name: displayName })
					.eq('id', user.id);
			}

			const { data: org, error: orgError } = await locals.supabase
				.from('organizations')
				.insert({ name, created_by: user.id })
				.select('id, name')
				.single();

			if (orgError || !org)
				return fail(500, { message: orgError?.message ?? 'Failed to create workspace.' });

			const { error: memberError } = await locals.supabase
				.from('organization_members')
				.insert({ organization_id: org.id, user_id: user.id, role: 'owner' });

			if (memberError) {
				try {
					await locals.supabase.from('organizations').delete().eq('id', org.id);
				} catch {
					// no-op
				}
				return fail(500, { message: memberError.message });
			}

			const { error: profileError } = await locals.supabase
				.from('profiles')
				.update({ active_org_id: org.id })
				.eq('id', user.id);

			if (profileError) return fail(500, { message: profileError.message });

			return { orgId: org.id, step: 2 };
		}

		if (action === 'updateProfile') {
			const displayName = String(form.get('display_name') || '').trim();
			if (displayName) {
				await locals.supabase
					.from('profiles')
					.update({ display_name: displayName })
					.eq('id', user.id);
			}
			return { step: 3 };
		}

		return fail(400, { message: 'Unknown action' });
	}
};
