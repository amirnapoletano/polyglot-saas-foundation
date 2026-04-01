import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database';
import { env } from '$env/dynamic/private';

export type OrgBillingRow = {
	organization_id: string;
	stripe_customer_id: string | null;
	stripe_subscription_id: string | null;
	status: string | null;
	price_id: string | null;
	current_period_end: string | null; // ISO string
	cancel_at_period_end: boolean | null;
	updated_at: string | null;
};

export type OrgBillingResult = {
	billing: OrgBillingRow | null;
	isActive: boolean;
	plan: 'free' | 'pro';
	status: string;
	willCancel: boolean;
	cancelsAt: string | null; // ISO string (only when scheduled)
	currentPeriodEnd: string | null; // ISO string
};

function isMissingTableError(error: { code?: string; message?: string } | null | undefined) {
	return (
		error?.code === '42P01' ||
		error?.message?.includes('org_billing') === true ||
		error?.message?.includes('does not exist') === true
	);
}

export function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' {
	if (!priceId) return 'free';

	// safest: only treat it as pro if it matches your configured pro price id
	const proPriceId = env.STRIPE_PRICE_ID;
	if (proPriceId && priceId === proPriceId) return 'pro';

	// unknown price ids -> default to free (safe)
	return 'free';
}

export function isSubscriptionActive(status: string | null | undefined): boolean {
	return status === 'active' || status === 'trialing';
}

/**
 * Fetch org billing state.
 * - Never hard-fails if the table is missing (early dev).
 * - cancel_at_period_end=true + status=active is STILL ACTIVE until period end.
 */
export async function getOrgBilling(
	locals: { supabase: SupabaseClient<Database> },
	organizationId: string
): Promise<OrgBillingResult> {
	const { data, error } = await locals.supabase
		.from('org_billing')
		.select(
			'organization_id, stripe_customer_id, stripe_subscription_id, status, price_id, current_period_end, cancel_at_period_end, updated_at'
		)
		.eq('organization_id', organizationId)
		.maybeSingle();

	if (error && !isMissingTableError(error as any)) {
		throw error;
	}

	const billing = (data ?? null) as OrgBillingRow | null;

	const status = billing?.status ?? 'inactive';
	const isActive = isSubscriptionActive(status);

	// Plan: active/trialing → derived from price, else free
	const plan = isActive ? getPlanFromPriceId(billing?.price_id ?? null) : 'free';

	const currentPeriodEnd = billing?.current_period_end ?? null;
	const willCancel = Boolean(billing?.cancel_at_period_end);
	const cancelsAt = willCancel ? currentPeriodEnd : null;

	return {
		billing,
		isActive,
		plan,
		status,
		willCancel,
		cancelsAt,
		currentPeriodEnd
	};
}
