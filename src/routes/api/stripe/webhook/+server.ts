// src/routes/api/stripe/webhook/+server.ts
import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { logActivity, type AuditAction } from '$lib/server/audit';

export const POST: RequestHandler = async ({ request, locals }) => {
	const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
	const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

	if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
		return new Response('Stripe not configured', { status: 501 });
	}

	const stripe = new Stripe(STRIPE_SECRET_KEY);

	const getMetadataValue = (
		metadata: Stripe.Metadata | null | undefined,
		key: string
	): string | null => {
		const value = metadata?.[key];
		if (typeof value !== 'string') return null;
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	};

	const isMissingTableError = (error: { code?: string; message?: string } | null) =>
		error?.code === '42P01' ||
		(error?.message?.includes('org_billing') && error.message.includes('does not exist'));

	const getSubscriptionPriceId = (subscription: Stripe.Subscription): string | null => {
		const firstItem = subscription.items.data?.[0];
		if (!firstItem) return null;

		const price = firstItem.price;
		if (!price) return null;
		if (typeof price === 'string') return price;
		return price.id ?? null;
	};

	const resolveOrgIdFromCustomer = async (customerId: string): Promise<string | null> => {
		try {
			const customer = await stripe.customers.retrieve(customerId);
			if ('deleted' in customer && customer.deleted) return null;
			return getMetadataValue(customer.metadata, 'organization_id');
		} catch {
			return null;
		}
	};

	const upsertOrgBilling = async (args: {
		organizationId: string;
		subscription: Stripe.Subscription;
		stripeCustomerId: string | null;
	}) => {
		const { organizationId, subscription, stripeCustomerId } = args;

		const latestSubscription = await stripe.subscriptions.retrieve(subscription.id);

		const { error } = await locals.supabase.from('org_billing').upsert(
			{
				organization_id: organizationId,
				stripe_customer_id: stripeCustomerId,
				stripe_subscription_id: latestSubscription.id,
				status: latestSubscription.status,
				price_id: getSubscriptionPriceId(latestSubscription),
				current_period_end: latestSubscription.items.data[0]?.current_period_end
					? new Date(latestSubscription.items.data[0].current_period_end * 1000).toISOString()
					: null,
				cancel_at_period_end: latestSubscription.cancel_at_period_end,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'organization_id' }
		);

		if (error && !isMissingTableError(error)) throw error;
	};

	// ---- Verify Stripe signature ----
	const sig = request.headers.get('stripe-signature');
	if (!sig) return new Response('Missing signature', { status: 400 });

	const body = await request.text();

	let event: Stripe.Event;
	try {
		event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
	} catch (err: unknown) {
		const message = err instanceof Error ? err.message : 'Invalid signature';
		return new Response(`Webhook error: ${message}`, {
			status: 400
		});
	}

	// ---- Handle events ----
	try {
		switch (event.type) {
			case 'customer.subscription.created':
			case 'customer.subscription.updated':
			case 'customer.subscription.deleted': {
				const subscription = event.data.object as Stripe.Subscription;

				const stripeCustomerId =
					typeof subscription.customer === 'string' ? subscription.customer : null;

				// Best source: subscription metadata
				let organizationId = getMetadataValue(subscription.metadata, 'organization_id');

				// Fallback: customer metadata
				if (!organizationId && stripeCustomerId) {
					organizationId = await resolveOrgIdFromCustomer(stripeCustomerId);
				}

				if (!organizationId) return new Response('ok', { status: 200 });

				await upsertOrgBilling({ organizationId, subscription, stripeCustomerId });

				// Audit log for billing events
				const billingAction: AuditAction =
					event.type === 'customer.subscription.created'
						? 'billing.subscribed'
						: event.type === 'customer.subscription.deleted'
							? 'billing.cancelled'
							: 'billing.updated';
				const { data: orgOwner } = await locals.supabase
					.from('organization_members')
					.select('user_id')
					.eq('organization_id', organizationId)
					.eq('role', 'owner')
					.maybeSingle();
				if (orgOwner?.user_id) {
					await logActivity(locals.supabase, {
						organizationId,
						actorUserId: orgOwner.user_id,
						action: billingAction,
						resourceType: 'subscription',
						resourceId: subscription.id,
						metadata: { status: subscription.status }
					});
				}

				return new Response('ok', { status: 200 });
			}

			case 'checkout.session.completed': {
				const session = event.data.object as Stripe.Checkout.Session;

				if (session.mode !== 'subscription') return new Response('ok', { status: 200 });

				const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null;

				let organizationId = getMetadataValue(session.metadata, 'organization_id');

				// Get subscription (needed to persist status/period_end)
				let subscription: Stripe.Subscription | null = null;
				if (typeof session.subscription === 'string') {
					subscription = await stripe.subscriptions.retrieve(session.subscription);
					if (!organizationId) {
						organizationId = getMetadataValue(subscription.metadata, 'organization_id');
					}
				}

				// Fallback: customer metadata
				if (!organizationId && stripeCustomerId) {
					organizationId = await resolveOrgIdFromCustomer(stripeCustomerId);
				}

				if (!organizationId || !subscription) return new Response('ok', { status: 200 });

				await upsertOrgBilling({ organizationId, subscription, stripeCustomerId });

				// Audit log for checkout completion
				const { data: checkoutOrgOwner } = await locals.supabase
					.from('organization_members')
					.select('user_id')
					.eq('organization_id', organizationId)
					.eq('role', 'owner')
					.maybeSingle();
				if (checkoutOrgOwner?.user_id) {
					await logActivity(locals.supabase, {
						organizationId,
						actorUserId: checkoutOrgOwner.user_id,
						action: 'billing.subscribed',
						resourceType: 'subscription',
						resourceId: subscription.id,
						metadata: { status: subscription.status }
					});
				}

				return new Response('ok', { status: 200 });
			}

			default:
				return new Response('ok', { status: 200 });
		}
	} catch (error) {
		console.error('stripe webhook handler error', error);
		return new Response('Webhook handler error', { status: 500 });
	}
};
