import type { LayoutServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	const { session } = await locals.safeGetSession();

	const isAuthRoute =
		url.pathname.startsWith('/login') ||
		url.pathname.startsWith('/signup') ||
		url.pathname.startsWith('/reset-password');

	// If not logged in and trying to access /app
	if (!session && url.pathname.startsWith('/app')) {
		throw redirect(303, `/login?next=${encodeURIComponent(url.pathname)}`);
	}

	// If logged in and trying to access auth pages → go to dashboard
	if (session && isAuthRoute) {
		throw redirect(303, '/app/dashboard');
	}

	return { session };
};