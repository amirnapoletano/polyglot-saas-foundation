import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	reset: async ({ request, locals, url }) => {
		const form = await request.formData();
		const email = String(form.get('email') || '');

		const { error } = await locals.supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/login`
		});

		if (error) return fail(400, { message: error.message });

		return { ok: true };
	}
};
