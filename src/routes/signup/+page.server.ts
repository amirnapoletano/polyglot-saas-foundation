import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();

		const email = String(form.get('email') ?? '');
		const password = String(form.get('password') ?? '');

		const { error } = await locals.supabase.auth.signUp({
			email,
			password,
			options: {
				emailRedirectTo: `${url.origin}/auth/callback`
			}
		});

		if (error) {
			return fail(400, { message: error.message });
		}

		throw redirect(303, '/verify-email');
	}
};
