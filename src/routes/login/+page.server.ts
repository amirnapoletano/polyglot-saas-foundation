import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals, url }) => {
  const { session } = await locals.safeGetSession();

  // already logged in? go to app
  if (session) throw redirect(303, '/app/dashboard');

  return { next: url.searchParams.get('next') ?? '/app/dashboard' };
};

export const actions: Actions = {
  login: async ({ request, locals, url }) => {
    const form = await request.formData();
    const email = String(form.get('email') || '');
    const password = String(form.get('password') || '');

    const { error } = await locals.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return fail(400, { message: error.message });

    const next = url.searchParams.get('next') || '/app/dashboard';
    throw redirect(303, next);
  }
};