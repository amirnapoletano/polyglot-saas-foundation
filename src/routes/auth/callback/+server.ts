// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals }) => {
  const code = url.searchParams.get('code');

  const nextParam = url.searchParams.get('next') ?? '/app/dashboard';
  const safeNext = nextParam.startsWith('/') ? nextParam : '/app/dashboard';

  const oauthError = url.searchParams.get('error');
  const oauthErrorDesc = url.searchParams.get('error_description');

  if (oauthError) {
    throw redirect(303, `/login?error=${encodeURIComponent(oauthErrorDesc ?? oauthError)}`);
  }

  if (!code) {
    throw redirect(303, '/login?error=Missing%20auth%20code');
  }

  const { error } = await locals.supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
  }

  throw redirect(303, safeNext);
};