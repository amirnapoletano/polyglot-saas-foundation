# Deployment Guide

This guide covers deploying the Polyglot SaaS Foundation to production with Vercel, Supabase, Stripe, and Resend.

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier works)
- A [Supabase](https://supabase.com) project
- A [Stripe](https://stripe.com) account with a product and price created
- A [Resend](https://resend.com) account (optional — emails log to console without it)
- A domain name (optional but recommended)

## 1. Supabase Setup

### Create a Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project
2. Choose a region close to your users
3. Save the database password — you'll need it for direct DB access

### Run the Schema

Open the SQL Editor in your Supabase dashboard and run the full schema from the [Database Setup section](../README.md#database-setup) of the README. This creates all tables, RLS policies, and the signup trigger.

### Add the API Keys Table

If not already present, also run:

```sql
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  prefix text not null,
  scopes text[] default '{}',
  last_used_at timestamptz,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.api_keys enable row level security;

create policy "Members can view org API keys"
  on public.api_keys for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );
```

### Create the Avatars Storage Bucket

1. Go to **Storage** in your Supabase dashboard
2. Create a new bucket called `avatars`
3. Set it to **Public**
4. Add a policy allowing authenticated users to upload:
   - Operation: `INSERT`
   - Target roles: `authenticated`
   - Policy: `true` (or scope to user's own folder)

### Configure Auth

1. Go to **Authentication → URL Configuration**
2. Set **Site URL** to your production domain: `https://yourdomain.com`
3. Add **Redirect URLs**:
   - `https://yourdomain.com/auth/callback`
   - `http://localhost:5173/auth/callback` (for local dev)
4. Go to **Authentication → Email Templates** and customize the confirmation and reset password emails with your brand

### Get Your Keys

From **Settings → API**, copy:

- **Project URL** → `PUBLIC_SUPABASE_URL`
- **anon / public key** → `PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

> The service role key bypasses RLS. Never expose it to the client.

## 2. Stripe Setup

### Create a Product

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com)
2. Switch to **Test mode** first to verify everything works
3. Go to **Products → Add product**
4. Create a product with a recurring price (e.g., "Pro Plan — $29/month")
5. Copy the **Price ID** (starts with `price_`)

### Get Your API Keys

From **Developers → API keys**:

- **Publishable key** → `PUBLIC_STRIPE_PUBLISHABLE_KEY`
- **Secret key** → `STRIPE_SECRET_KEY`

### Set Up Webhooks

1. Go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Set the URL to: `https://yourdomain.com/api/stripe/webhook`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`) → `STRIPE_WEBHOOK_SECRET`

### Local Webhook Testing

For local development, use the Stripe CLI:

```bash
# Install: https://stripe.com/docs/stripe-cli
stripe login
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

Copy the webhook signing secret it outputs to your `.env`.

### Go Live

When ready for production:

1. Switch to **Live mode** in the Stripe Dashboard
2. Create the same product/price in Live mode
3. Update your environment variables with live keys
4. Create a new webhook endpoint with the production URL

## 3. Resend Setup (Email)

### Create an Account

1. Sign up at [resend.com](https://resend.com)
2. Go to **API Keys** and create a new key
3. Copy the key → `RESEND_API_KEY`

### Verify Your Domain

1. Go to **Domains → Add Domain**
2. Add your domain (e.g., `yourdomain.com`)
3. Add the DNS records Resend provides (DKIM, SPF, return path)
4. Wait for verification (usually a few minutes)

### Set the From Address

Update `EMAIL_FROM` in your environment:

```
EMAIL_FROM=YourApp <noreply@yourdomain.com>
```

The domain must match your verified domain in Resend.

> **Dev mode**: If `RESEND_API_KEY` is not set, emails are logged to the console instead of sent. No configuration needed for local development.

## 4. Vercel Deployment

### Install the Vercel Adapter

```bash
npm i -D @sveltejs/adapter-vercel
```

Update `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter()
	}
};
```

### Deploy

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new) and import your repo
3. Vercel auto-detects SvelteKit — no build settings needed
4. Add your environment variables (see below)
5. Click **Deploy**

### Environment Variables

Set these in **Vercel → Project Settings → Environment Variables**:

| Variable                        | Value                          | Notes                    |
| ------------------------------- | ------------------------------ | ------------------------ |
| `PUBLIC_SUPABASE_URL`           | `https://xxx.supabase.co`      | From Supabase settings   |
| `PUBLIC_SUPABASE_ANON_KEY`      | `eyJ...`                       | From Supabase settings   |
| `SUPABASE_SERVICE_ROLE_KEY`     | `eyJ...`                       | Server-only              |
| `PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...`                  | Or `pk_test_` for test   |
| `STRIPE_SECRET_KEY`             | `sk_live_...`                  | Or `sk_test_` for test   |
| `STRIPE_PRICE_ID`               | `price_...`                    | Your Pro plan price      |
| `STRIPE_WEBHOOK_SECRET`         | `whsec_...`                    | From Stripe webhook      |
| `RESEND_API_KEY`                | `re_...`                       | Optional                 |
| `EMAIL_FROM`                    | `App <noreply@yourdomain.com>` | Must match Resend domain |

### Custom Domain

1. Go to **Vercel → Project Settings → Domains**
2. Add your domain
3. Update DNS records as instructed by Vercel
4. Update your **Supabase Site URL** and **Redirect URLs** to use the new domain
5. Update your **Stripe webhook** endpoint URL

## 5. Post-Deployment Checklist

### Verify Auth Flow

- [ ] Sign up with a new email → confirmation email received
- [ ] Click confirmation link → redirected to app
- [ ] Welcome email received (if Resend configured)
- [ ] Login with email/password works
- [ ] Password reset flow works
- [ ] Logout and redirect to login page

### Verify Billing Flow

- [ ] Click "Upgrade to Pro" → redirected to Stripe checkout
- [ ] Complete test payment → webhook fires → plan updated to Pro
- [ ] "Manage Billing" → redirected to Stripe portal
- [ ] Cancel subscription → webhook fires → plan reverts to Free

### Verify Team Features

- [ ] Create a workspace during onboarding
- [ ] Invite a team member by email → invite email received
- [ ] Accept invite via link → added to org
- [ ] Role changes work (owner can change roles)
- [ ] Member removal works
- [ ] Org switching works (if multiple orgs)

### Verify API Keys (Pro Plan)

- [ ] Create an API key → full key displayed once
- [ ] Copy key and test: `curl -H "Authorization: Bearer pk_live_..." https://yourdomain.com/api/v1/me`
- [ ] Revoke key → subsequent requests return 401

### Verify Security

- [ ] Check response headers in browser DevTools (Network tab):
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- [ ] Rate limiting: rapidly hitting login returns 429
- [ ] Direct access to `/app/*` without auth redirects to `/login`

## Alternative Platforms

The project uses `@sveltejs/adapter-auto` by default, which works with:

### Netlify

```bash
npm i -D @sveltejs/adapter-netlify
```

Update `svelte.config.js` to use the Netlify adapter. Deploy by connecting your repo in the Netlify dashboard. Set environment variables in **Site Settings → Environment Variables**.

### Cloudflare Pages

```bash
npm i -D @sveltejs/adapter-cloudflare
```

Note: The in-memory rate limiter won't work on Cloudflare Workers (stateless). You'll need to use Upstash Redis or Cloudflare KV instead.

### Node.js Server

```bash
npm i -D @sveltejs/adapter-node
```

Build with `npm run build`, then run:

```bash
node build
```

Set environment variables in your hosting environment.

## Monitoring

### Stripe Webhook Logs

Check **Developers → Webhooks → [Your endpoint] → Attempts** in the Stripe Dashboard to verify webhook delivery and debug failures.

### Supabase Logs

Check **Logs → Edge Functions** and **Logs → Postgres** in the Supabase Dashboard for database and auth errors.

### Vercel Logs

Check **Deployments → [Latest] → Functions** in the Vercel Dashboard for server-side errors and request logs.

## Content Security Policy (CSP)

A CSP header is not included by default because it depends on which external services your app loads (analytics, fonts, images, etc.). To add one, edit `src/hooks.server.ts`:

```ts
response.headers.set(
	'Content-Security-Policy',
	"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' https://your-supabase-url.supabase.co data:; connect-src 'self' https://your-supabase-url.supabase.co https://api.stripe.com;"
);
```

Adjust the directives to match your actual external dependencies.
