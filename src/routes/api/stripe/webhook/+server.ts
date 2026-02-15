import Stripe from 'stripe';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from '$env/static/private';
import type { RequestHandler } from './$types';

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });

export const POST: RequestHandler = async ({ request, locals }) => {
  const sig = request.headers.get('stripe-signature');
  const body = await request.text();

  if (!sig) return new Response('Missing signature', { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    return new Response(`Webhook error: ${err.message}`, { status: 400 });
  }

  // TODO: handle events and upsert org_billing
  // - customer.subscription.created/updated/deleted
  // - checkout.session.completed

  return new Response('ok', { status: 200 });
};