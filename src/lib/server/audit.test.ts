import { describe, it, expect } from 'vitest';
import type { AuditAction } from './audit';

describe('AuditAction type', () => {
	it('covers all expected actions', () => {
		const actions: AuditAction[] = [
			'member.invited',
			'member.removed',
			'member.role_changed',
			'invite.cancelled',
			'invite.accepted',
			'org.renamed',
			'org.deleted',
			'org.created',
			'billing.subscribed',
			'billing.cancelled',
			'billing.updated',
			'api_key.created',
			'api_key.revoked'
		];

		expect(actions).toHaveLength(13);
		// Each action should be a non-empty string with a dot separator
		for (const action of actions) {
			expect(action).toMatch(/^[a-z_]+\.[a-z_]+$/);
		}
	});

	it('groups actions by domain', () => {
		const actions: AuditAction[] = [
			'member.invited',
			'member.removed',
			'member.role_changed',
			'invite.cancelled',
			'invite.accepted',
			'org.renamed',
			'org.deleted',
			'org.created',
			'billing.subscribed',
			'billing.cancelled',
			'billing.updated',
			'api_key.created',
			'api_key.revoked'
		];

		const domains = new Set(actions.map((a) => a.split('.')[0]));
		expect(domains).toEqual(new Set(['member', 'invite', 'org', 'billing', 'api_key']));
	});
});
