import { json, error as kitError } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals, url }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw kitError(401, 'Unauthorized');

	const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 50);
	const unreadOnly = url.searchParams.get('unread') === 'true';

	let query = locals.supabase
		.from('notifications')
		.select('id, type, title, body, href, read_at, created_at')
		.eq('user_id', user.id)
		.order('created_at', { ascending: false })
		.limit(limit);

	if (unreadOnly) {
		query = query.is('read_at', null);
	}

	const { data, error } = await query;
	if (error) throw kitError(500, error.message);

	// Get unread count
	const { count } = await locals.supabase
		.from('notifications')
		.select('id', { count: 'exact', head: true })
		.eq('user_id', user.id)
		.is('read_at', null);

	return json({ notifications: data ?? [], unreadCount: count ?? 0 });
};

export const PATCH: RequestHandler = async ({ locals, request }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw kitError(401, 'Unauthorized');

	const body = await request.json();
	const { action, notificationId } = body;

	if (action === 'read' && notificationId) {
		await locals.supabase
			.from('notifications')
			.update({ read_at: new Date().toISOString() })
			.eq('id', notificationId)
			.eq('user_id', user.id);
	} else if (action === 'read-all') {
		await locals.supabase
			.from('notifications')
			.update({ read_at: new Date().toISOString() })
			.eq('user_id', user.id)
			.is('read_at', null);
	}

	return json({ success: true });
};

export const DELETE: RequestHandler = async ({ locals, request }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw kitError(401, 'Unauthorized');

	const body = await request.json();
	const { notificationId } = body;

	if (notificationId) {
		await locals.supabase
			.from('notifications')
			.delete()
			.eq('id', notificationId)
			.eq('user_id', user.id);
	}

	return json({ success: true });
};
