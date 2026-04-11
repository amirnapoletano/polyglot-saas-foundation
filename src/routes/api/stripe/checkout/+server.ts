import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url }) => {
	const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
	const STRIPE_PRICE_ID = env.STRIPE_PRICE_ID;

	if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
		return new Response('Stripe not configured', { status: 500 });
	}

	// Auth (match your existing pattern)
	const { session: authSession, user } = await locals.safeGetSession();
	if (!authSession || !user) return new Response('Unauthorized', { status: 401 });
	const userId = user.id;

	// Resolve org safely: prefer server-known org, else first membership
	const localsExt = locals as Record<string, unknown> & {
		org?: { id?: string };
		organization?: { id?: string };
	};
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
			console.error('checkout: membership lookup error', error);
			return new Response('Unable to resolve organization', { status: 500 });
		}

		organizationId = membership?.organization_id ?? null;
	}

	if (!organizationId) {
		return new Response('No organization found for user', { status: 400 });
	}

	// Hard safety: ensure user is actually a member of that org
	const { data: confirmMembership, error: confirmError } = await locals.supabase
		.from('organization_members')
		.select('role')
		.eq('user_id', userId)
		.eq('organization_id', organizationId)
		.maybeSingle();

	if (confirmError) {
		console.error('checkout: membership confirm error', confirmError);
		return new Response('Unable to confirm membership', { status: 500 });
	}
	if (!confirmMembership) {
		return new Response('Forbidden', { status: 403 });
	}

	const stripe = new Stripe(STRIPE_SECRET_KEY);
	const successUrl = `${url.origin}/app/dashboard?stripe=success`;
	const cancelUrl = `${url.origin}/app/premium?stripe=cancel`;

	// 1) Read billing row (if it exists)
	const { data: billing, error: billingError } = await locals.supabase
		.from('org_billing')
		.select('stripe_customer_id, status')
		.eq('organization_id', organizationId)
		.maybeSingle();

	if (billingError) {
		console.error('checkout: billing lookup error', billingError);
		return new Response('Billing lookup failed', { status: 500 });
	}

	// If already subscribed, don’t create a new checkout session
	if (billing?.status === 'active' || billing?.status === 'trialing') {
		return new Response(JSON.stringify({ url: `${url.origin}/app/premium` }), {
			headers: { 'content-type': 'application/json' }
		});
	}

	// 2) Reuse existing Stripe customer, or create one once per org
	let customerId = billing?.stripe_customer_id ?? null;

	if (!customerId) {
		const customer = await stripe.customers.create({
			metadata: { organization_id: String(organizationId) }
		});

		customerId = customer.id;

		// Save customer id immediately for future checkouts
		const { error: saveCustomerError } = await locals.supabase.from('org_billing').upsert(
			{
				organization_id: organizationId,
				stripe_customer_id: customerId,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'organization_id' }
		);

		if (saveCustomerError) {
			console.error('checkout: saving stripe_customer_id failed', saveCustomerError);
			return new Response('Unable to save billing customer', { status: 500 });
		}
	}

	// Prevent duplicate sessions on double-click
	const idempotencyKey = `${userId}:${organizationId}:${STRIPE_PRICE_ID}`;

	// 3) Create checkout session tied to that customer
	const session = await stripe.checkout.sessions.create(
		{
			mode: 'subscription',
			customer: customerId,
			line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
			success_url: successUrl,
			cancel_url: cancelUrl,
			metadata: { organization_id: String(organizationId) },
			subscription_data: {
				metadata: { organization_id: String(organizationId) }
			}
		},
		{ idempotencyKey }
	);

	return new Response(JSON.stringify({ url: session.url }), {
		headers: { 'content-type': 'application/json' }
	});
};
