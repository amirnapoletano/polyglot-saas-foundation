import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	const { user } = await locals.safeGetSession();

	// Already verified — go to app
	if (user?.email_confirmed_at) {
		throw redirect(303, '/app/dashboard');
	}

	return { email: user?.email ?? null };
};

export const actions: Actions = {
	resend: async ({ locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user?.email) return fail(400, { error: 'No email found.' });

		const { error } = await locals.supabase.auth.resend({
			type: 'signup',
			email: user.email
		});

		if (error) return fail(500, { error: error.message });
		return { sent: true };
	}
};
