import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

type NotificationType =
	| 'invite.received'
	| 'invite.accepted'
	| 'member.removed'
	| 'member.role_changed'
	| 'billing.subscribed'
	| 'billing.cancelled'
	| 'org.renamed';

interface CreateNotificationParams {
	organizationId: string;
	userId: string;
	type: NotificationType;
	title: string;
	body?: string;
	href?: string;
}

export async function createNotification(
	supabase: SupabaseClient<Database>,
	params: CreateNotificationParams
) {
	try {
		await supabase.from('notifications').insert({
			organization_id: params.organizationId,
			user_id: params.userId,
			type: params.type,
			title: params.title,
			body: params.body ?? null,
			href: params.href ?? null
		});
	} catch {
		// Silently fail — notifications should never break the main flow
	}
}

export async function notifyOrgMembers(
	supabase: SupabaseClient<Database>,
	organizationId: string,
	excludeUserId: string,
	notification: Omit<CreateNotificationParams, 'organizationId' | 'userId'>
) {
	try {
		const { data: members } = await supabase
			.from('organization_members')
			.select('user_id')
			.eq('organization_id', organizationId);

		if (!members) return;

		const rows = members
			.filter((m) => m.user_id && m.user_id !== excludeUserId)
			.map((m) => ({
				organization_id: organizationId,
				user_id: m.user_id!,
				type: notification.type,
				title: notification.title,
				body: notification.body ?? null,
				href: notification.href ?? null
			}));

		if (rows.length > 0) {
			await supabase.from('notifications').insert(rows);
		}
	} catch {
		// Silently fail
	}
}
