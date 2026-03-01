import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe not configured', { status: 501 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

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
}) => {
  const { organizationId, subscription } = args;

  const { error } = await locals.supabase
    .from('org_billing')
    .upsert(
      {
        organization_id: organizationId,
        stripe_subscription_id: subscription.id,
        status: subscription.status,
        price_id: getSubscriptionPriceId(subscription),
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'organization_id' }
    );

  if (error && !isMissingTableError(error)) throw error;
};

  // ---- Stripe signature verification ----
  const sig = request.headers.get('stripe-signature');
  if (!sig) return new Response('Missing signature', { status: 400 });

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook error: ${err?.message ?? 'Invalid signature'}`, {
      status: 400
    });
  }

  // ---- Event handling ----
  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;

        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : null;

        // Best source: subscription metadata (because we set subscription_data.metadata at checkout)
        let organizationId = getMetadataValue(subscription.metadata, 'organization_id');

        // Fallback: customer metadata
        if (!organizationId && customerId) {
          organizationId = await resolveOrgIdFromCustomer(customerId);
        }

        // If we can't map, don't fail the webhook (avoid endless retries)
        if (!organizationId) return new Response('ok', { status: 200 });

        await upsertOrgBilling({ organizationId, subscription });
        return new Response('ok', { status: 200 });
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode !== 'subscription') return new Response('ok', { status: 200 });

        const customerId = typeof session.customer === 'string' ? session.customer : null;

        // Session metadata is optional; subscription metadata is preferred.
        let organizationId = getMetadataValue(session.metadata, 'organization_id');

        let subscription: Stripe.Subscription | null = null;

        if (typeof session.subscription === 'string') {
          subscription = await stripe.subscriptions.retrieve(session.subscription);
          if (!organizationId) {
            organizationId = getMetadataValue(subscription.metadata, 'organization_id');
          }
        }

        if (!organizationId && customerId) {
          organizationId = await resolveOrgIdFromCustomer(customerId);
        }

        if (!organizationId || !subscription) return new Response('ok', { status: 200 });

        await upsertOrgBilling({ organizationId, subscription });
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