// src/lib/server/billing.ts
export type OrgBillingRow = {
  status: string | null;
  price_id: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
};

export function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' {
  if (!priceId) return 'free';

  // IMPORTANT:
  // In SvelteKit server code, use env from $env/dynamic/private or hard-map price IDs.
  // If you only have ONE paid plan, simplest is: any known paid price_id => pro.
  // Replace this with your real price id(s).
  // Example:
  // if (priceId === env.STRIPE_PRICE_ID) return 'pro';

  return 'pro';
}

export async function getOrgBilling(locals: any, organizationId: string) {
  const { data, error } = await locals.supabase
    .from('org_billing')
    .select('status, price_id, current_period_end, cancel_at_period_end')
    .eq('organization_id', organizationId)
    .maybeSingle();

  // Never hard-fail the page because billing might not exist yet
  if (error) {
    return {
      billing: null as OrgBillingRow | null,
      isActive: false,
      plan: 'free' as const
    };
  }

  const billing = (data ?? null) as OrgBillingRow | null;
  const status = billing?.status ?? null;

  const isActive = status === 'active' || status === 'trialing';
  const plan = isActive ? 'pro' : 'free';

  return { billing, isActive, plan };
}