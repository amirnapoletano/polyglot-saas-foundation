import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals, url, request }) => {
  const STRIPE_SECRET_KEY = env.STRIPE_SECRET_KEY;
  const STRIPE_PRICE_ID = env.STRIPE_PRICE_ID;

  if (!STRIPE_SECRET_KEY || !STRIPE_PRICE_ID) {
    return new Response('Stripe not configured', { status: 500 });
  }

  // Auth
  const userId = (locals as any)?.user?.id ?? null;
  if (!userId) return new Response('Unauthorized', { status: 401 });

  // Resolve org safely: prefer server-known org, else first membership
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
      console.error('checkout: membership lookup error', error);
      return new Response('Unable to resolve organization', { status: 500 });
    }

    organizationId = membership?.organization_id ?? null;
  }

  if (!organizationId) {
    return new Response('No organization found for user', { status: 400 });
  }

  // Optional hard safety: ensure user is actually a member of that org
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

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

  const successUrl = `${url.origin}/app/dashboard?stripe=success`;
  const cancelUrl = `${url.origin}/app/premium?stripe=cancel`;

  // Prevent duplicate sessions on double-click
  const idempotencyKey = `${userId}:${organizationId}:${STRIPE_PRICE_ID}`;

  const session = await stripe.checkout.sessions.create({
  mode: 'subscription',
  line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
  success_url: successUrl,
  cancel_url: cancelUrl,
  metadata: { organization_id: String(organizationId) },
  subscription_data: {
    metadata: { organization_id: String(organizationId) }
  }
});

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'content-type': 'application/json' }
  });
};