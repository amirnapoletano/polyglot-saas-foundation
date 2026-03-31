import type { Handle } from '@sveltejs/kit';
import { supabaseServerClient } from '$lib/server/supabase';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { verifyApiKey } from '$lib/server/api-keys';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = supabaseServerClient(event.cookies);

  // Expose a canonical "safeGetSession" helper + a direct "user" field for convenience
  event.locals.safeGetSession = async () => {
    // 1) Verify user (trusted)
    const {
      data: { user },
      error: userError
    } = await event.locals.supabase.auth.getUser();

    if (userError || !user) {
      for (const c of event.cookies.getAll()) {
        if (c.name.startsWith('sb-')) event.cookies.delete(c.name, { path: '/' });
      }
      event.locals.user = null;
      return { session: null, user: null };
    }

    // 2) Get session (optional but useful)
    const {
      data: { session },
      error: sessionError
    } = await event.locals.supabase.auth.getSession();

    if (sessionError || !session) {
      for (const c of event.cookies.getAll()) {
        if (c.name.startsWith('sb-')) event.cookies.delete(c.name, { path: '/' });
      }
      event.locals.user = null;
      return { session: null, user: null };
    }

    event.locals.user = user;
    return { session, user };
  };

  // Try to populate locals.user for routes that don't call safeGetSession explicitly
  try {
    const {
      data: { user }
    } = await event.locals.supabase.auth.getUser();
    event.locals.user = user ?? null;
  } catch {
    event.locals.user = null;
  }

  // API key authentication for /api/v1/* routes
  if (event.url.pathname.startsWith('/api/v1/')) {
    const authHeader = event.request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const key = authHeader.slice(7);
      const { createClient } = await import('@supabase/supabase-js');
      const { env } = await import('$env/dynamic/private');
      const serviceClient = createClient(PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY!);
      const result = await verifyApiKey(serviceClient, key);
      if (result.valid && result.organizationId) {
        event.locals.apiKeyOrgId = result.organizationId;
        event.locals.apiKeyId = result.keyId;
      }
    }
  }

  const response = await resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
};