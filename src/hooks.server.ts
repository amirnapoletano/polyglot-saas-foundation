import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { createServerClient } from '@supabase/ssr';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  // Create a Supabase server client that can read/write cookies.
  const supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });

  event.locals.supabase = supabase;

  // Helper to get a *trusted* user (Supabase recommends validating via getUser()).
  // Also important: calling getUser() allows @supabase/ssr to refresh sessions and
  // update cookies when needed, which prevents redirect loops.
  event.locals.safeGetSession = async () => {
    const {
      data: { session }
    } = await supabase.auth.getSession();

    if (!session) {
      return { session: null, user: null };
    }

    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      return { session: null, user: null };
    }

    return { session, user };
  };

  return resolve(event, {
    // Recommended by Supabase when using their SSR client.
    // (Allows certain Supabase headers through in load functions.)
    filterSerializedResponseHeaders(name) {
      return name === 'content-range' || name === 'x-supabase-api-version';
    }
  });
};