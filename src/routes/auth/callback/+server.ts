// src/routes/auth/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { sendEmail } from '$lib/server/email';
import { welcomeEmail } from '$lib/emails/welcome';

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

  const { data, error } = await locals.supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw redirect(303, `/login?error=${encodeURIComponent(error.message)}`);
  }

  // Send welcome email on first login (profile just created by trigger)
  if (data.user) {
    const { data: profile } = await locals.supabase
      .from('profiles')
      .select('created_at, display_name, email')
      .eq('id', data.user.id)
      .maybeSingle();

    if (profile) {
      const createdAt = new Date(profile.created_at).getTime();
      const isNewUser = Date.now() - createdAt < 60_000; // within last minute

      if (isNewUser && profile.email) {
        const dashboardUrl = `${url.origin}/app/dashboard`;
        const emailContent = welcomeEmail({
          displayName: profile.display_name ?? undefined,
          dashboardUrl
        });
        await sendEmail({
          to: profile.email,
          subject: emailContent.subject,
          html: emailContent.html
        });
      }
    }
  }

  throw redirect(303, safeNext);
};