import type { Actions, PageServerLoad } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { randomBytes } from 'crypto';

async function getOrgId(locals: App.Locals): Promise<{ orgId: string; userId: string }> {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw redirect(302, '/login');

	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	const orgId = profile?.active_org_id;
	if (!orgId) throw redirect(302, '/onboarding');
	return { orgId, userId: user.id };
}

export const load: PageServerLoad = async ({ parent, locals }) => {
	const parentData = await parent();
	const orgId = parentData.org?.id;
	if (!orgId) return { webhooks: [], deliveries: [] };

	const [webhooksResult, deliveriesResult] = await Promise.all([
		locals.supabase
			.from('webhooks')
			.select('id, url, events, active, created_at')
			.eq('organization_id', orgId)
			.order('created_at', { ascending: false }),
		locals.supabase
			.from('webhook_deliveries')
			.select('id, webhook_id, event, status_code, success, created_at')
			.order('created_at', { ascending: false })
			.limit(20)
	]);

	return {
		webhooks: webhooksResult.data ?? [],
		deliveries: deliveriesResult.data ?? [],
		currentUserRole: parentData.org?.role
	};
};

const WEBHOOK_EVENTS = [
	'member.invited',
	'member.removed',
	'member.role_changed',
	'invite.accepted',
	'org.renamed',
	'billing.subscribed',
	'billing.cancelled',
	'billing.updated',
	'api_key.created',
	'api_key.revoked'
];

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const { orgId, userId } = await getOrgId(locals);

		const form = await request.formData();
		const url = String(form.get('url') ?? '').trim();
		const selectedEvents = form.getAll('events').map(String);

		if (!url) return fail(400, { message: 'URL is required.' });
		try {
			new URL(url);
		} catch {
			return fail(400, { message: 'Invalid URL.' });
		}

		const secret = `whsec_${randomBytes(24).toString('hex')}`;

		const { error: insertError } = await locals.supabase.from('webhooks').insert({
			organization_id: orgId,
			url,
			secret,
			events: selectedEvents.length > 0 ? selectedEvents : WEBHOOK_EVENTS,
			created_by: userId
		});

		if (insertError) return fail(500, { message: insertError.message });

		return { success: true, secret };
	},

	toggle: async ({ request, locals }) => {
		await getOrgId(locals);
		const form = await request.formData();
		const id = String(form.get('id'));
		const active = form.get('active') === 'true';

		await locals.supabase.from('webhooks').update({ active }).eq('id', id);
		return { success: true };
	},

	delete: async ({ request, locals }) => {
		await getOrgId(locals);
		const form = await request.formData();
		const id = String(form.get('id'));

		await locals.supabase.from('webhooks').delete().eq('id', id);
		return { success: true };
	}
};
