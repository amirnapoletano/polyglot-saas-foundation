import crypto from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

const KEY_PREFIX = 'pk_live_';

export function generateApiKey(): { key: string; prefix: string; hash: string } {
	const random = crypto.randomBytes(32).toString('base64url');
	const key = `${KEY_PREFIX}${random}`;
	const prefix = key.slice(0, 12) + '...';
	const hash = crypto.createHash('sha256').update(key).digest('hex');
	return { key, prefix, hash };
}

export function hashApiKey(key: string): string {
	return crypto.createHash('sha256').update(key).digest('hex');
}

export async function verifyApiKey(
	supabase: SupabaseClient<Database>,
	key: string
): Promise<{ valid: boolean; organizationId?: string; keyId?: string }> {
	const hash = hashApiKey(key);

	const { data, error } = await supabase
		.from('api_keys')
		.select('id, organization_id, revoked_at, expires_at')
		.eq('key_hash', hash)
		.maybeSingle();

	if (error || !data) return { valid: false };
	if (data.revoked_at) return { valid: false };
	if (data.expires_at && new Date(data.expires_at) < new Date()) return { valid: false };

	// Update last_used_at (fire-and-forget)
	supabase
		.from('api_keys')
		.update({ last_used_at: new Date().toISOString() })
		.eq('id', data.id)
		.then(() => {});

	return { valid: true, organizationId: data.organization_id, keyId: data.id };
}
