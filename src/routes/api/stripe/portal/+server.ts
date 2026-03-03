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
  let organizationId: string | null =
    (locals as any)?.org?.id ??
    (locals as any)?.organization?.id ??
    null;

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
    return new Response('Unable to confirm membership', { status: 500 });
  }
  if (!confirmMembership) return new Response('Forbidden', { status: 403 });

  // Get subscription id for this org
  const { data: billing, error: billingError } = await locals.supabase
    .from('org_billing')
    .select('stripe_subscription_id, status')
    .eq('organization_id', organizationId)
    .maybeSingle();

  if (billingError) {
    console.error('portal: billing lookup error', billingError);
    return new Response('Billing lookup failed', { status: 500 });
  }

  const subId = billing?.stripe_subscription_id;

  // If they’re not subscribed yet, send them to premium page
  if (!subId) {
    return new Response(JSON.stringify({ url: `${url.origin}/app/premium` }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  // Derive Stripe customer from subscription
  const subscription = await stripe.subscriptions.retrieve(subId);
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : null;

  if (!customerId) return new Response('Missing Stripe customer', { status: 500 });

  // Create portal session
  const portal = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${url.origin}/app/premium`
  });

  return new Response(JSON.stringify({ url: portal.url }), {
    headers: { 'content-type': 'application/json' }
  });
};