# Polyglot SaaS Foundation

A production-ready SaaS starter kit built with **SvelteKit 2**, **Svelte 5**, **Supabase**, and **Stripe**. Skip weeks of boilerplate and start building your product on day one.

## What's Included

- **Authentication** — Email/password signup, login, logout, password reset. Server-validated sessions with secure cookie handling.
- **Multi-Organization** — Users can belong to multiple workspaces. Org switching, active workspace persistence, automatic repair if membership changes.
- **Team Management** — Invite members by email with token-based links. Role-based access (owner/admin/member). Seat limits per plan.
- **Stripe Billing** — Per-org subscriptions with checkout, webhook sync, and customer portal. Free/Pro plan gating with usage limits.
- **Onboarding Flow** — Post-signup workspace creation that sets up org, membership, and active state in one step.
- **App Shell** — Responsive sidebar layout with navigation, org switcher, user profile, and mobile menu.
- **UI Component Library** — Button, Input, Card, Badge, Avatar, Toast — all built with Tailwind CSS v4.
- **Dark Mode Ready** — CSS custom properties with dark mode support via class toggle.
- **Error Handling** — Branded error pages for 404/500 states.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | SvelteKit 2 + Svelte 5 |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Auth & Database | Supabase |
| Billing | Stripe |
| Build | Vite 7 |
| Code Quality | ESLint + Prettier |

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url> my-saas-app
cd my-saas-app
npm install
```

### 2. Set up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL schema (see [Database Setup](#database-setup) below)
3. Copy your project URL and keys

### 3. Set up Stripe

1. Create an account at [stripe.com](https://stripe.com)
2. Create a product with a recurring price in Test mode
3. Copy your API keys, price ID, and webhook secret

### 4. Configure environment

```bash
cp .env.example .env
```

Fill in your `.env`:

```
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 5. Run

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## Database Setup

Run this SQL in your Supabase SQL Editor to create the required tables:

```sql
-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  plan text default 'free',
  active_org_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Organizations
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Organization Members (many-to-many)
create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz default now(),
  unique(organization_id, user_id)
);

-- Organization Billing (one per org)
create table public.org_billing (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  updated_at timestamptz default now()
);

-- Organization Invites
create table public.org_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  token text not null unique,
  expires_at timestamptz,
  created_at timestamptz default now(),
  accepted_at timestamptz
);

-- Projects (for usage limits)
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  created_at timestamptz default now()
);

-- Audit Log (activity tracking)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Add foreign key from profiles to organizations
alter table public.profiles
  add constraint profiles_active_org_fk
  foreign key (active_org_id)
  references public.organizations(id)
  on delete set null;
```

### Recommended RLS Policies

Enable Row Level Security on all tables and add policies:

```sql
-- Enable RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.org_billing enable row level security;
alter table public.org_invites enable row level security;
alter table public.projects enable row level security;
alter table public.audit_log enable row level security;

-- Profiles: users can read/update their own
create policy "Users can view own profile"
  on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

-- Organizations: members can view their orgs
create policy "Members can view their organizations"
  on public.organizations for select using (
    id in (select organization_id from public.organization_members where user_id = auth.uid())
  );
create policy "Authenticated users can create organizations"
  on public.organizations for insert with check (auth.uid() = created_by);

-- Organization Members: members can view co-members
create policy "Members can view org members"
  on public.organization_members for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );
create policy "Owners/admins can manage members"
  on public.organization_members for all using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Org Billing: members can view their org's billing
create policy "Members can view org billing"
  on public.org_billing for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

-- Org Invites: members can view, owners/admins can manage
create policy "Members can view org invites"
  on public.org_invites for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

-- Projects: members can view their org's projects
create policy "Members can view org projects"
  on public.projects for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

-- Audit Log: members can view, system can insert
create policy "Members can view audit log"
  on public.audit_log for select using (
    organization_id in (select organization_id from public.organization_members where user_id = auth.uid())
  );
create policy "Authenticated users can insert audit log"
  on public.audit_log for insert with check (auth.uid() = actor_user_id);
```

## Project Structure

```
src/
├── app.css                          # Tailwind + design tokens + dark mode
├── app.d.ts                         # TypeScript types for App.Locals
├── app.html                         # HTML shell
├── hooks.server.ts                  # Auth middleware (runs on every request)
├── lib/
│   ├── components/
│   │   ├── AuthLayout.svelte        # Shared layout for auth pages
│   │   └── ui/
│   │       ├── Avatar.svelte        # Initials-based avatar
│   │       ├── Badge.svelte         # Status badges
│   │       ├── Button.svelte        # Primary/secondary/danger/ghost
│   │       ├── Card.svelte          # Container component
│   │       ├── Input.svelte         # Form input with label/error
│   │       └── Toast.svelte         # Toast notifications
│   ├── server/
│   │   ├── billing.ts               # Stripe billing helpers
│   │   ├── organizations.ts         # Org query helpers
│   │   ├── supabase.ts              # Per-request Supabase client
│   │   ├── team-limits.ts           # Seat limit logic
│   │   └── usage.ts                 # Project limit enforcement
│   └── stores/
│       └── toast.ts                 # Toast notification store
├── routes/
│   ├── +layout.server.ts            # Root: session check + redirects
│   ├── +layout.svelte               # Root: CSS + font + toast mount
│   ├── +page.svelte                 # Landing/marketing page
│   ├── +error.svelte                # Error page (404/500)
│   ├── login/                       # Login page
│   ├── signup/                      # Signup page
│   ├── reset-password/              # Password reset
│   ├── onboarding/                  # Post-signup workspace creation
│   ├── auth/callback/               # Supabase auth callback
│   ├── invite/[token]/              # Accept team invite
│   └── app/
│       ├── +layout.server.ts        # Auth guard + loads org/billing data
│       ├── +layout.svelte           # App shell (sidebar, nav, org switcher)
│       ├── dashboard/               # Dashboard with stats + quick actions
│       ├── members/                 # Team management + invites
│       ├── premium/                 # Billing + plan comparison
│       ├── settings/                # Profile + workspace settings
│       └── logout/                  # Session destruction
│   └── api/
│       ├── stripe/checkout/         # Create Stripe checkout session
│       ├── stripe/webhook/          # Handle Stripe webhook events
│       ├── stripe/portal/           # Redirect to Stripe portal
│       ├── organizations/switch/    # Switch active organization
│       ├── invites/create/          # Create team invite
│       ├── invites/[inviteId]/      # Cancel invite
│       ├── members/[memberUserId]/  # Remove member
│       └── members/[memberUserId]/role/  # Change member role
```

## Customization

### Change brand colors

Edit `src/app.css` — update the `--color-brand-*` values in the `@theme` block.

### Change plan limits

Edit `src/lib/server/team-limits.ts` for seat limits and `src/lib/server/usage.ts` for project limits.

### Add new app pages

1. Create a new route under `src/routes/app/your-page/`
2. Add a `+page.svelte` — auth is automatic (handled by the layout)
3. Access org/user/billing data via the `data` prop (loaded by `app/+layout.server.ts`)
4. Add a nav link in `src/routes/app/+layout.svelte`

### Scope data by organization

All queries should filter by `organization_id`:

```ts
const { data } = await locals.supabase
  .from('your_table')
  .select('*')
  .eq('organization_id', activeOrgId);
```

## Stripe Webhook (Local Dev)

To test Stripe webhooks locally:

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:5173/api/stripe/webhook
```

Copy the webhook signing secret it gives you into your `.env` as `STRIPE_WEBHOOK_SECRET`.

## Deployment

### Vercel (Recommended)

```bash
npm i -D @sveltejs/adapter-vercel
```

Update `svelte.config.js` to use the Vercel adapter, push to GitHub, and connect your repo in the Vercel dashboard. Set your environment variables in the Vercel project settings.

### Other platforms

The project uses `@sveltejs/adapter-auto` by default, which works with Vercel, Netlify, and Cloudflare. See the [SvelteKit adapters docs](https://svelte.dev/docs/kit/adapters) for details.

## License

This is a commercial starter kit. You may use it to build unlimited projects for yourself or your clients. You may not redistribute or resell the kit itself.

---

Built by [Polyglot](https://polyglot.dev)
