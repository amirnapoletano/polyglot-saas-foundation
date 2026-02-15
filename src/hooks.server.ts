import type { Handle } from '@sveltejs/kit';
import { supabaseServerClient } from '$lib/server/supabase';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = supabaseServerClient(event.cookies);

  event.locals.safeGetSession = async () => {
    let session: any = null;

    try {
      const {
        data: { session: s }
      } = await event.locals.supabase.auth.getSession();
      session = s;
    } catch {
      for (const c of event.cookies.getAll()) {
        if (c.name.startsWith('sb-')) {
          event.cookies.delete(c.name, { path: '/' });
        }
      }
      return { session: null, user: null };
    }

    if (!session) return { session: null, user: null };

    const {
      data: { user },
      error
    } = await event.locals.supabase.auth.getUser();

    if (error || !user) {
      for (const c of event.cookies.getAll()) {
        if (c.name.startsWith('sb-')) {
          event.cookies.delete(c.name, { path: '/' });
        }
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