import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';

export async function isFeatureEnabled(
	supabase: SupabaseClient<Database>,
	key: string,
	organizationId?: string
): Promise<boolean> {
	try {
		// Check org-specific flag first
		if (organizationId) {
			const { data: orgFlag } = await supabase
				.from('feature_flags')
				.select('enabled')
				.eq('key', key)
				.eq('organization_id', organizationId)
				.maybeSingle();

			if (orgFlag) return orgFlag.enabled;
		}

		// Fall back to global flag
		const { data: globalFlag } = await supabase
			.from('feature_flags')
			.select('enabled')
			.eq('key', key)
			.is('organization_id', null)
			.maybeSingle();

		return globalFlag?.enabled ?? false;
	} catch {
		return false;
	}
}

export async function getAllFlags(
	supabase: SupabaseClient<Database>,
	organizationId?: string
): Promise<Record<string, boolean>> {
	try {
		const { data: flags } = await supabase
			.from('feature_flags')
			.select('key, enabled, organization_id')
			.or(
				organizationId
					? `organization_id.is.null,organization_id.eq.${organizationId}`
					: 'organization_id.is.null'
			);

		if (!flags) return {};

		const result: Record<string, boolean> = {};

		// Global flags first
		for (const f of flags.filter((f) => !f.organization_id)) {
			result[f.key] = f.enabled;
		}
		// Org flags override
		for (const f of flags.filter((f) => f.organization_id)) {
			result[f.key] = f.enabled;
		}

		return result;
	} catch {
		return {};
	}
}
