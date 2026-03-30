import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logActivity } from '$lib/server/audit';

export const POST: RequestHandler = async ({ params, locals }) => {
	const { user } = await locals.safeGetSession();
	if (!user) return new Response('Unauthorized', { status: 401 });

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	if (!profile?.active_org_id) return new Response('No active organization', { status: 400 });

	// Verify owner/admin
	const { data: membership } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('organization_id', profile.active_org_id)
		.eq('user_id', user.id)
		.maybeSingle();

	if (!membership?.role || !['owner', 'admin'].includes(membership.role)) {
		return new Response('Only owners and admins can revoke API keys', { status: 403 });
	}

	// Verify key belongs to this org
	const { data: apiKey } = await locals.supabase
		.from('api_keys')
		.select('id, name, organization_id')
		.eq('id', params.keyId)
		.eq('organization_id', profile.active_org_id)
		.maybeSingle();

	if (!apiKey) return new Response('API key not found', { status: 404 });

	const { error: updateError } = await locals.supabase
		.from('api_keys')
		.update({ revoked_at: new Date().toISOString() })
		.eq('id', params.keyId);

	if (updateError) return new Response(updateError.message, { status: 500 });

	await logActivity(locals.supabase, {
		organizationId: profile.active_org_id,
		actorUserId: user.id,
		action: 'api_key.revoked',
		resourceType: 'api_key',
		resourceId: params.keyId,
		metadata: { name: apiKey.name }
	});

	return json({ success: true });
};
