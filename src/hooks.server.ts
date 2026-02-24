import type { Handle } from '@sveltejs/kit';
import { supabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = supabaseServerClient(event.cookies);

 event.locals.safeGetSession = async () => {
  // 1) Always verify the user first (secure)
  const {
    data: { user },
    error: userError
  } = await event.locals.supabase.auth.getUser();

  // If no verified user, clear sb-* cookies and bail
  if (userError || !user) {
    for (const c of event.cookies.getAll()) {
      if (c.name.startsWith('sb-')) event.cookies.delete(c.name, { path: '/' });
    }
    return { session: null, user: null };
  }

  // 2) Session is optional. If you need access_token / expiry, grab it.
  const {
    data: { session },
    error: sessionError
  } = await event.locals.supabase.auth.getSession();

  // If session fails for any reason, treat as logged out
  if (sessionError || !session) {
    for (const c of event.cookies.getAll()) {
      if (c.name.startsWith('sb-')) event.cookies.delete(c.name, { path: '/' });
    }
    return { session: null, user: null };
  }

  return { session, user };
};

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};