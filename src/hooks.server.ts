import type { Handle } from '@sveltejs/kit';
import { supabaseServerClient } from '$lib/server/supabase';

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

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};