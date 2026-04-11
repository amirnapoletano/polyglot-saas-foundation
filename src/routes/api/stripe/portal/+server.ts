// src/routes/api/stripe/portal/+server.ts
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;

	if (!STRIPE_SECRET_KEY) {
		return new Response('Stripe not configured', { status: 500 });
	}

	// Require auth
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) return new Response('Unauthorized', { status: 401 });

	const userId = user.id;

	// Resolve org (server-side only)
	const localsExt = locals as Record<string, unknown> & { org?: { id?: string }; organization?: { id?: string } };
	let organizationId: string | null = localsExt?.org?.id ?? localsExt?.organization?.id ?? null;

	if (!organizationId) {
		const { data: membership, error } = await locals.supabase
			.from('organization_members')
			.select('organization_id')
			.eq('user_id', userId)
			.order('created_at', { ascending: true })
			.limit(1)
			.maybeSingle();

		if (error) {
			console.error('portal: membership lookup error', error);
			return new Response('Unable to resolve organization', { status: 500 });
		}

		organizationId = membership?.organization_id ?? null;
	}

	if (!organizationId) return new Response('No organization found', { status: 400 });

	// Confirm user is member of org
	const { data: confirmMembership, error: confirmError } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('user_id', userId)
		.eq('organization_id', organizationId)
		.maybeSingle();

	if (confirmError) {
		console.error('portal: confirm membership error', confirmError);
	}
	if (!confirmMembership) return new Response('Forbidden', { status: 403 });

	// Pull billing row
	const { data: billing, error: billingError } = await locals.supabase
		.from('org_billing')
		.select('stripe_customer_id, stripe_subscription_id, status')
		.eq('organization_id', organizationId)
		.maybeSingle();

	if (billingError) {
		console.error('portal: billing lookup error', billingError);
		return new Response('Billing lookup failed', { status: 500 });
	}

	// If no subscription yet → send them to premium page
	if (!billing?.stripe_subscription_id) {
		return new Response(JSON.stringify({ url: `${url.origin}/app/premium` }), {
			headers: { 'content-type': 'application/json' }
		});
	}

	const stripe = new Stripe(STRIPE_SECRET_KEY);

	// Prefer DB customer id (fastest / most stable)
	let customerId: string | null = billing?.stripe_customer_id ?? null;

	// Fallback: derive from subscription and backfill DB
	if (!customerId) {
		const subscription = await stripe.subscriptions.retrieve(billing.stripe_subscription_id);
		customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

		if (customerId) {
			const { error: backfillError } = await locals.supabase
				.from('org_billing')
				.update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
				.eq('organization_id', organizationId);

			if (backfillError) {
				console.error('portal: backfill stripe_customer_id error', backfillError);
				// Don’t fail portal for a backfill issue
			}
		}
	}

	if (!customerId) return new Response('Missing Stripe customer', { status: 500 });

	const portal = await stripe.billingPortal.sessions.create({
		customer: customerId,
		return_url: `${url.origin}/app/premium`
	});

	return new Response(JSON.stringify({ url: portal.url }), {
		headers: { 'content-type': 'application/json' }
	});
};
