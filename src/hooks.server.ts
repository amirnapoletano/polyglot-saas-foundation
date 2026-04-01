import type { Handle } from '@sveltejs/kit';
import { supabaseServerClient } from '$lib/server/supabase';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { verifyApiKey } from '$lib/server/api-keys';
import { rateLimit, limiters, rateLimitResponse } from '$lib/server/rate-limit';

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

	// Rate limiting for API routes
	const ip = event.getClientAddress();
	const path = event.url.pathname;

	if (path.startsWith('/api/invites/create') && event.request.method === 'POST') {
		const result = rateLimit(`invite:${ip}`, limiters.invite);
		if (!result.allowed) return rateLimitResponse(result);
	}

	if (path.startsWith('/api/api-keys') && event.request.method === 'POST') {
		const result = rateLimit(`apikey:${ip}`, limiters.apiKey);
		if (!result.allowed) return rateLimitResponse(result);
	}

	if (path.startsWith('/api/stripe/checkout') && event.request.method === 'POST') {
		const result = rateLimit(`checkout:${ip}`, limiters.auth);
		if (!result.allowed) return rateLimitResponse(result);
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

				// Rate limit per API key
				const rl = rateLimit(`v1:${result.keyId}`, limiters.api);
				if (!rl.allowed) return rateLimitResponse(rl);
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
