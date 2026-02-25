import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = env.STRIPE_WEBHOOK_SECRET;

  if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    return new Response('Stripe not configured', { status: 501 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
};

export const POST: RequestHandler = async ({ request, locals }) => {
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
    const firstItem = subscription.items.data[0];
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

    const { error } = await locals.supabase.from('org_billing').upsert(
      {
        organization_id: organizationId,
        status: subscription.status,
        price_id: getSubscriptionPriceId(subscription),
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        cancel_at_period_end: subscription.cancel_at_period_end
      },
      { onConflict: 'organization_id' }
    );

    if (error && !isMissingTableError(error)) throw error;
  };

  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!sig) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === 'string' ? subscription.customer : null;

        let organizationId = getMetadataValue(subscription.metadata, 'organization_id');
        if (!organizationId && customerId) {
          organizationId = await resolveOrgIdFromCustomer(customerId);
        }
        if (!organizationId) break;

        await upsertOrgBilling({ organizationId, subscription });
        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== 'subscription') break;

        const customerId = typeof session.customer === 'string' ? session.customer : null;
        let organizationId = getMetadataValue(session.metadata, 'organization_id');

        let subscription: Stripe.Subscription | null = null;
        if (typeof session.subscription === 'string') {
          const fetched = await stripe.subscriptions.retrieve(session.subscription);
          subscription = fetched;
          if (!organizationId) {
            organizationId = getMetadataValue(fetched.metadata, 'organization_id');
          }
        } else if (session.subscription && typeof session.subscription !== 'string') {
          subscription = session.subscription as Stripe.Subscription;
          if (!organizationId) {
            organizationId = getMetadataValue(subscription.metadata, 'organization_id');
          }
        }

        if (!organizationId && customerId) {
          organizationId = await resolveOrgIdFromCustomer(customerId);
        }
        if (!organizationId || !subscription) break;

        await upsertOrgBilling({ organizationId, subscription });
        break;
      }
    }
  } catch (error) {
    console.error('stripe webhook handler error', error);
    return new Response('Webhook handler error', { status: 500 });
  }

  return new Response('ok', { status: 200 });
};
