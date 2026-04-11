import { createHmac } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

export type WebhookEvent =
	| 'member.invited'
	| 'member.removed'
	| 'member.role_changed'
	| 'invite.accepted'
	| 'org.renamed'
	| 'billing.subscribed'
	| 'billing.cancelled'
	| 'billing.updated'
	| 'api_key.created'
	| 'api_key.revoked';

function signPayload(payload: string, secret: string): string {
	return createHmac('sha256', secret).update(payload).digest('hex');
}

export async function dispatchWebhooks(
	supabase: SupabaseClient<Database>,
	organizationId: string,
	event: WebhookEvent,
	data: Record<string, unknown>
) {
	try {
		const { data: webhooks } = await supabase
			.from('webhooks')
			.select('id, url, secret, events')
			.eq('organization_id', organizationId)
			.eq('active', true);

		if (!webhooks || webhooks.length === 0) return;

		const payload = JSON.stringify({
			event,
			data,
			organization_id: organizationId,
			timestamp: new Date().toISOString()
		});

		for (const webhook of webhooks) {
			// Check if this webhook subscribes to this event
			if (webhook.events.length > 0 && !webhook.events.includes(event)) continue;

			const signature = signPayload(payload, webhook.secret);

			try {
				const response = await fetch(webhook.url, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
						'X-Webhook-Signature': signature,
						'X-Webhook-Event': event
					},
					body: payload,
					signal: AbortSignal.timeout(10000)
				});

				await supabase.from('webhook_deliveries').insert({
					webhook_id: webhook.id,
					event,
					payload: JSON.parse(payload),
					status_code: response.status,
					response_body: await response.text().catch(() => null),
					success: response.ok
				});
			} catch (err) {
				await supabase.from('webhook_deliveries').insert({
					webhook_id: webhook.id,
					event,
					payload: JSON.parse(payload),
					status_code: null,
					response_body: err instanceof Error ? err.message : 'Unknown error',
					success: false
				});
			}
		}
	} catch {
		// Silently fail — webhooks should never break the main flow
	}
}
