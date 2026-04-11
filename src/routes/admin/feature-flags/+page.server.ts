import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { data: flags } = await locals.supabase
		.from('feature_flags')
		.select('id, key, description, enabled, organization_id, created_at')
		.is('organization_id', null)
		.order('key', { ascending: true });

	return { flags: flags ?? [] };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const form = await request.formData();
		const key = String(form.get('key') ?? '').trim().toLowerCase().replace(/\s+/g, '_');
		const description = String(form.get('description') ?? '').trim();

		if (!key || key.length < 2) return fail(400, { message: 'Key is required (min 2 chars).' });

		const { error } = await locals.supabase
			.from('feature_flags')
			.insert({ key, description: description || null, enabled: false });

		if (error) {
			if (error.code === '23505') return fail(400, { message: 'Flag key already exists.' });
			return fail(500, { message: error.message });
		}

		return { success: true };
	},

	toggle: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id'));
		const enabled = form.get('enabled') === 'true';

		await locals.supabase.from('feature_flags').update({ enabled }).eq('id', id);

		return { success: true };
	},

	delete: async ({ request, locals }) => {
		const form = await request.formData();
		const id = String(form.get('id'));

		await locals.supabase.from('feature_flags').delete().eq('id', id);

		return { success: true };
	}
};
