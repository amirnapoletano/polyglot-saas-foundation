# Customization Guide

Step-by-step instructions for the most common customizations you'll make when building your product on this foundation.

## Rename the App

The app name "Polyglot" appears in a few places:

1. **Email templates** — `src/lib/emails/welcome.ts` and `src/lib/emails/invite.ts` (subject lines, footer text)
2. **Auth layout** — `src/lib/components/AuthLayout.svelte` (logo/title)
3. **App layout sidebar** — `src/routes/app/+layout.svelte` (brand name in sidebar header)
4. **Landing page** — `src/routes/+page.svelte`
5. **HTML title** — `src/app.html` (`<title>` tag)
6. **Email from address** — `.env` (`EMAIL_FROM`)

Search for "Polyglot" across the project to catch any other references.

## Change Brand Colors

Edit `src/app.css`. The brand palette is defined in the `@theme` block:

```css
@theme {
	--color-brand-50: oklch(0.97 0.01 264);
	--color-brand-100: oklch(0.94 0.03 264);
	/* ... through brand-900 */
}
```

All UI components reference these tokens (e.g., `bg-brand-600`, `text-brand-500`), so changing the values here updates the entire app.

**Tip**: Use [oklch.com](https://oklch.com) to generate a consistent palette in OKLCH color space, or convert your hex colors to OKLCH values.

### Dark Mode

Dark mode overrides are in the same file under `.dark`:

```css
.dark {
	--color-surface: oklch(0.17 0.02 264);
	--color-text-primary: oklch(0.96 0.01 264);
	/* ... */
}
```

## Add a New App Page

### 1. Create the route

```bash
mkdir -p src/routes/app/your-page
```

Create `src/routes/app/your-page/+page.svelte`:

```svelte
<script lang="ts">
	import PageHeader from '$lib/components/ui/PageHeader.svelte';
	import Card from '$lib/components/ui/Card.svelte';

	let { data } = $props();
</script>

<PageHeader title="Your Page" subtitle="Description of this page" />

<Card>
	<p>Org: {data.org?.name}</p>
	<p>Plan: {data.plan}</p>
</Card>
```

Auth is automatic — the `app/+layout.server.ts` guard protects all `/app/*` routes. The `data` prop includes `user`, `profile`, `org`, `billing`, `plan`, and `organizations` from the layout.

### 2. Add page-specific data loading (optional)

Create `src/routes/app/your-page/+page.server.ts`:

```ts
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const { org } = await parent();

	const { data: items } = await locals.supabase
		.from('your_table')
		.select('*')
		.eq('organization_id', org.id)
		.order('created_at', { ascending: false });

	return { items: items ?? [] };
};
```

### 3. Add a sidebar nav link

Edit `src/routes/app/+layout.svelte`. Find the `navItems` array and add your page:

```ts
const navItems = [
	{ href: '/app/dashboard', label: 'Dashboard', icon: 'home', shortcut: 'G D' },
	// ... existing items
	{ href: '/app/your-page', label: 'Your Page', icon: 'star', shortcut: 'G Y' }
];
```

Add the corresponding SVG icon path in the icon rendering section, and add the keyboard shortcut in the shortcut handler.

## Add a New API Route

### Internal API (session-authenticated)

Create `src/routes/api/your-endpoint/+server.ts`:

```ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const { session, user } = await locals.safeGetSession();
	if (!session || !user) throw error(401, 'Unauthorized');

	// Get the user's active org
	const { data: profile } = await locals.supabase
		.from('profiles')
		.select('active_org_id')
		.eq('id', user.id)
		.maybeSingle();

	const orgId = profile?.active_org_id;
	if (!orgId) throw error(400, 'No active organization');

	// Your logic here
	const body = await request.json();

	return json({ ok: true });
};
```

### Public API (API key-authenticated)

Create `src/routes/api/v1/your-endpoint/+server.ts`:

```ts
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals }) => {
	// API key auth is handled by hooks.server.ts
	// These values are set automatically for /api/v1/* routes
	const orgId = locals.apiKeyOrgId;
	if (!orgId) throw error(401, 'Invalid API key');

	const { data } = await locals.supabase
		.from('your_table')
		.select('*')
		.eq('organization_id', orgId);

	return json({ data });
};
```

The Bearer token authentication and rate limiting is handled automatically in `hooks.server.ts` for all `/api/v1/*` routes.

### Add Rate Limiting to Your Endpoint

Edit `src/hooks.server.ts` and add a rate limit check:

```ts
if (event.url.pathname === '/api/your-endpoint') {
	const ip = event.getClientAddress();
	const result = rateLimit(`your-endpoint:${ip}`, limiters.invite); // or a custom config
	if (!result.allowed) return rateLimitResponse(result);
}
```

## Add a Database Table

### 1. Create the table in Supabase

Run this SQL in the Supabase SQL Editor:

```sql
create table public.your_table (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.your_table enable row level security;

-- Members can view their org's data
create policy "Members can view"
  on public.your_table for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );

-- Owners/admins can insert
create policy "Owners/admins can insert"
  on public.your_table for insert with check (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
```

### 2. Regenerate TypeScript types

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/lib/types/database.ts
```

This updates the `Database` type used by the typed Supabase client throughout the app.

### 3. Query the table

```ts
const { data, error } = await locals.supabase
	.from('your_table')
	.select('*')
	.eq('organization_id', orgId);
```

TypeScript will auto-complete column names and infer return types.

## Modify Billing Plans

### Change Plan Names or Limits

Edit `src/lib/server/team-limits.ts`:

```ts
export function getSeatLimitFromPlan(plan: string | null): number {
	switch (plan) {
		case 'pro':
			return 10;
		case 'enterprise':
			return 50; // add a new tier
		default:
			return 3;
	}
}
```

Edit `src/lib/server/usage.ts` for project limits.

### Add a New Plan Tier

1. Create a new price in the Stripe Dashboard
2. Add the price ID to `.env`:
   ```
   STRIPE_PRICE_ID_PRO=price_...
   STRIPE_PRICE_ID_ENTERPRISE=price_...
   ```
3. Update `src/lib/server/billing.ts`:
   ```ts
   export function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' | 'enterprise' {
   	if (priceId === STRIPE_PRICE_ID_ENTERPRISE) return 'enterprise';
   	if (priceId === STRIPE_PRICE_ID_PRO) return 'pro';
   	return 'free';
   }
   ```
4. Update the Premium page (`src/routes/app/premium/+page.svelte`) to show the new tier
5. Update seat/project limits to handle the new plan name

### Change Checkout Behavior

The checkout session is created in `src/routes/api/stripe/checkout/+server.ts`. You can modify:

- `mode` — `'subscription'` or `'payment'` for one-time
- `line_items` — add multiple items or quantities
- `allow_promotion_codes` — enable coupon support
- `trial_period_days` — add a free trial

## Add a Form Action

SvelteKit form actions handle form submissions server-side. Example for settings:

### Server (`+page.server.ts`)

```ts
import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const actions: Actions = {
	updateSomething: async ({ request, locals }) => {
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { error: 'Unauthorized' });

		const formData = await request.formData();
		const value = formData.get('value')?.toString().trim();

		if (!value) return fail(400, { error: 'Value is required' });

		const { error } = await locals.supabase.from('your_table').update({ value }).eq('id', user.id);

		if (error) return fail(500, { error: error.message });

		return { success: true };
	}
};
```

### Client (`+page.svelte`)

```svelte
<script lang="ts">
	import { enhance } from '$app/forms';
	import Button from '$lib/components/ui/Button.svelte';
	import Input from '$lib/components/ui/Input.svelte';

	let { form } = $props();
	let loading = $state(false);
</script>

<form
	method="POST"
	action="?/updateSomething"
	use:enhance={() => {
		loading = true;
		return async ({ update }) => {
			loading = false;
			await update();
		};
	}}
>
	<Input name="value" label="Your Value" />
	<Button type="submit" {loading}>Save</Button>
	{#if form?.error}<p class="text-error text-sm">{form.error}</p>{/if}
</form>
```

## Add an Email Template

Create `src/lib/emails/your-email.ts`:

```ts
export function yourEmail(params: { recipientName: string; actionUrl: string }): {
	subject: string;
	html: string;
} {
	const { recipientName, actionUrl } = params;

	return {
		subject: 'Your Subject Line',
		html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">
          <tr>
            <td style="padding:32px;">
              <p style="margin:0;font-size:15px;color:#374151;">
                Hi ${recipientName}, your content here.
              </p>
              <div style="text-align:center;margin:28px 0;">
                <a href="${actionUrl}" style="display:inline-block;padding:12px 32px;background:#4f46e5;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">
                  Take Action
                </a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">Sent by YourApp</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
	};
}
```

Send it from any server-side code:

```ts
import { sendEmail } from '$lib/server/email';
import { yourEmail } from '$lib/emails/your-email';

const content = yourEmail({ recipientName: 'Alex', actionUrl: 'https://...' });
await sendEmail({ to: 'alex@example.com', subject: content.subject, html: content.html });
```

## Add an Audit Action

1. Add the action to the union type in `src/lib/server/audit.ts`:

```ts
export type AuditAction =
	| 'member.invited'
	// ... existing actions
	| 'your_resource.created'
	| 'your_resource.deleted';
```

2. Log it wherever the action happens:

```ts
import { logActivity } from '$lib/server/audit';

await logActivity(locals.supabase, {
	organizationId: orgId,
	actorUserId: user.id,
	action: 'your_resource.created',
	resourceType: 'your_resource',
	resourceId: newResource.id,
	metadata: { name: newResource.name }
});
```

The activity page (`/app/activity`) will automatically display the new action.

## Customize the UI Components

All components are in `src/lib/components/ui/`. They use Svelte 5 syntax with `$props()`.

### Button Variants

Add a new variant to `Button.svelte`:

```svelte
<!-- In the variant styles object -->
const variants = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  secondary: '...',
  warning: 'bg-warning text-white hover:bg-amber-600', // new
};
```

### Add a New Component

Create `src/lib/components/ui/YourComponent.svelte`:

```svelte
<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title,
		children,
		class: className = ''
	}: {
		title: string;
		children: Snippet;
		class?: string;
	} = $props();
</script>

<div class="rounded-lg border border-border bg-surface p-4 {className}">
	<h3 class="text-sm font-medium text-text-primary">{title}</h3>
	{@render children()}
</div>
```

Use semantic color tokens (`text-text-primary`, `bg-surface`, `border-border`) so the component works in both light and dark modes.
