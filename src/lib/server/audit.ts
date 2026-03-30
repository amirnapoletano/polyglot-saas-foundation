import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Json } from '$lib/types/database';

export type AuditAction =
	| 'member.invited'
	| 'member.removed'
	| 'member.role_changed'
	| 'invite.cancelled'
	| 'invite.accepted'
	| 'org.renamed'
	| 'org.deleted'
	| 'org.created'
	| 'billing.subscribed'
	| 'billing.cancelled'
	| 'billing.updated'
	| 'api_key.created'
	| 'api_key.revoked';

export async function logActivity(
	supabase: SupabaseClient<Database>,
	args: {
		organizationId: string;
		actorUserId: string;
		action: AuditAction;
		resourceType?: string;
		resourceId?: string;
		metadata?: Record<string, Json | undefined>;
	}
) {
	try {
		await supabase.from('audit_log').insert({
			organization_id: args.organizationId,
			actor_user_id: args.actorUserId,
			action: args.action,
			resource_type: args.resourceType ?? null,
			resource_id: args.resourceId ?? null,
			metadata: args.metadata ?? null
		});
	} catch {
		// Audit logging should never break the main flow
		// Table may not exist yet in early dev
	}
}
