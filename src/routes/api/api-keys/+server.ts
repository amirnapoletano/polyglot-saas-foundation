import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { generateApiKey } from '$lib/server/api-keys';
import { getOrgBilling } from '$lib/server/billing';
import { logActivity } from '$lib/server/audit';

export const GET: RequestHandler = async ({ locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return new Response('Unauthorized', { status: 401 });

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile?.active_org_id) return json({ keys: [] });

	const { data: keys } = await locals.supabase
		.from('api_keys')
		.select('id, name, key_prefix, scopes, last_used_at, expires_at, created_at')
		.eq('organization_id', profile.active_org_id)
		.is('revoked_at', null)
		.order('created_at', { ascending: false });

	return json({ keys: keys ?? [] });
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return new Response('Unauthorized', { status: 401 });

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile?.active_org_id) return new Response('No active organization', { status: 400 });

	// Verify pro plan
	const { plan } = await getOrgBilling(locals, profile.active_org_id);
	if (plan !== 'pro') return new Response('API keys require a Pro plan', { status: 403 });

	// Verify owner/admin
	const { data: membership } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', profile.active_org_id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (!membership?.role || !['owner', 'admin'].includes(membership.role)) {
		return new Response('Only owners and admins can create API keys', { status: 403 });
	}

	const body = await request.json();
	const name = String(body.name || '').trim();
	if (!name || name.length > 100)
		return new Response('Name is required (max 100 chars)', { status: 400 });

	const { key, prefix, hash } = generateApiKey();

	const expiresAt = body.expires_in_days
		? new Date(Date.now() + body.expires_in_days * 86400000).toISOString()
		: null;

	const { error: insertError } = await locals.supabase.from('api_keys').insert({
		organization_id: profile.active_org_id,
		created_by: user.id,
		name,
		key_prefix: prefix,
		key_hash: hash,
		expires_at: expiresAt
	});

	if (insertError) return new Response(insertError.message, { status: 500 });

	await logActivity(locals.supabase, {
		organizationId: profile.active_org_id,
		actorUserId: user.id,
		action: 'api_key.created',
		resourceType: 'api_key',
		metadata: { name }
	});

	// Return the full key exactly once
	return json({ key, prefix });
};
