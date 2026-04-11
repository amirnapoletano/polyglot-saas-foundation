# Polyglot SaaS Foundation

A production-ready SaaS starter kit built with **SvelteKit 2**, **Svelte 5**, **Supabase**, and **Stripe**. Skip weeks of boilerplate and start building your product on day one.

## Documentation

| Document                               | Description                                                                           |
| -------------------------------------- | ------------------------------------------------------------------------------------- |
| [Architecture](docs/ARCHITECTURE.md)   | Data flow, request lifecycle, auth patterns, billing flow, multi-org design           |
| [Customization](docs/CUSTOMIZATION.md) | Step-by-step guides: add pages, API routes, DB tables, billing plans, email templates |
| [API Reference](docs/API.md)           | All endpoints, auth methods, request/response formats, rate limits                    |
| [Deployment](docs/DEPLOYMENT.md)       | Vercel setup, Supabase config, Stripe webhooks, Resend email, domain setup            |

## What's Included

- **Authentication** — Email/password signup, login, logout, password reset. Server-validated sessions with secure cookie handling.
- **Multi-Organization** — Users can belong to multiple workspaces. Org switching, active workspace persistence, automatic repair if membership changes.
- **Team Management** — Invite members by email with token-based links. Role-based access (owner/admin/member). Seat limits per plan.
- **Stripe Billing** — Per-org subscriptions with checkout, webhook sync, and customer portal. Free/Pro plan gating with usage limits.
- **Onboarding Flow** — Post-signup workspace creation that sets up org, membership, and active state in one step.
- **Audit Logging** — Activity timeline tracking member invites, role changes, billing events, and API key usage.
- **API Key Management** — Generate, revoke, and authenticate with SHA-256 hashed API keys (Pro plan). Bearer token auth for `/api/v1/*` routes.
- **Transactional Email** — Welcome and invite emails via Resend. Graceful dev fallback (logs to console when API key not set).
- **Rate Limiting** — In-memory sliding window limiter on auth, invites, API keys, checkout, and public API routes. 429 responses with Retry-After headers.
- **Security Headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on every response.
- **Avatar Uploads** — Profile image upload via Supabase Storage with initials fallback.
- **App Shell** — Responsive sidebar layout with navigation, org switcher, keyboard shortcuts, and mobile menu.
- **UI Component Library** — 12 components: Button, Input, Card, Badge, Avatar, Toast, ConfirmModal, ThemeToggle, PageHeader, EmptyState, NavProgress, and more.
- **Dark Mode** — CSS custom properties with dark mode toggle. Full design token system in Tailwind v4.
- **CI/CD Pipeline** — GitHub Actions workflow: lint, typecheck, build, and test on every push and PR.
- **Testing** — Vitest with 25+ unit tests covering API keys, billing, audit logging, and rate limiting.
- **Typed Database** — Auto-generated Supabase types for full TypeScript safety across all queries.
- **Error Handling** — Branded error pages for 404/500 states.

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Framework       | SvelteKit 2 + Svelte 5                 |
| Language        | TypeScript (strict)                    |
| Styling         | Tailwind CSS v4                        |
| Auth & Database | Supabase (PostgreSQL + Auth + Storage) |
| Billing         | Stripe (Checkout + Webhooks + Portal)  |
| Email           | Resend                                 |
| Testing         | Vitest                                 |
| CI/CD           | GitHub Actions                         |
| Build           | Vite 7                                 |
| Code Quality    | ESLint + Prettier                      |

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

Database migrations are in `supabase/migrations/`. Run them in order in your Supabase SQL Editor, or use the Supabase CLI.

| # | File | Description |
|---|------|-------------|
| 1 | `00001_create_tables.sql` | Core tables (profiles, organizations, members, billing, invites, projects, audit log, API keys) |
| 2 | `00002_triggers.sql` | Auto-create profile on signup, updated_at triggers |
| 3 | `00003_rls_policies.sql` | Row Level Security policies for all tables |
| 4 | `00004_indexes.sql` | Performance indexes for common queries |
| 5 | `00005_storage.sql` | Supabase Storage bucket for avatar uploads |
| 6 | `00006_seed.sql` | Optional seed data for development |

See [`supabase/README.md`](./supabase/README.md) for detailed setup instructions.

## Project Structure

```
src/
├── app.css                              # Tailwind v4 + design tokens + dark mode
├── app.d.ts                             # TypeScript types for App.Locals
├── app.html                             # HTML shell
├── hooks.server.ts                      # Auth, rate limiting, API key auth, security headers
├── lib/
│   ├── components/
│   │   ├── AuthLayout.svelte            # Shared layout for auth pages
│   │   └── ui/                          # 12 reusable UI components
│   │       ├── Avatar.svelte            # Profile avatar (image + initials fallback)
│   │       ├── Badge.svelte             # Status badges (success/warning/error/brand)
│   │       ├── Button.svelte            # Primary/secondary/danger/ghost variants
│   │       ├── Card.svelte              # Container component
│   │       ├── ConfirmModal.svelte      # Confirmation dialogs
│   │       ├── EmptyState.svelte        # Empty state placeholders
│   │       ├── Input.svelte             # Form input with label/error
│   │       ├── NavProgress.svelte       # Navigation progress bar
│   │       ├── PageHeader.svelte        # Page title + breadcrumbs
│   │       ├── ThemeToggle.svelte       # Dark mode toggle
│   │       └── Toast.svelte             # Toast notifications
│   ├── emails/
│   │   ├── welcome.ts                   # Welcome email template
│   │   └── invite.ts                    # Team invite email template
│   ├── server/
│   │   ├── api-keys.ts                  # API key generation, hashing, verification
│   │   ├── audit.ts                     # Activity logging to audit_log table
│   │   ├── billing.ts                   # Stripe billing helpers
│   │   ├── email.ts                     # Resend email service
│   │   ├── organizations.ts             # Org query helpers
│   │   ├── rate-limit.ts               # In-memory sliding window rate limiter
│   │   ├── supabase.ts                  # Per-request Supabase client
│   │   ├── team-limits.ts              # Seat limit logic (free=3, pro=10)
│   │   └── usage.ts                     # Project limit enforcement
│   ├── stores/
│   │   ├── theme.ts                     # Dark mode store
│   │   └── toast.ts                     # Toast notification store
│   └── types/
│       └── database.ts                  # Auto-generated Supabase types
├── routes/
│   ├── +layout.server.ts               # Root: session check + redirects
│   ├── +layout.svelte                   # Root: CSS + font + toast mount
│   ├── +page.svelte                     # Landing/marketing page
│   ├── +error.svelte                    # Error page (404/500)
│   ├── login/                           # Login page
│   ├── signup/                          # Signup page
│   ├── reset-password/                  # Password reset
│   ├── onboarding/                      # Post-signup workspace creation
│   ├── auth/callback/                   # Supabase auth callback + welcome email
│   ├── invite/[token]/                  # Accept team invite
│   ├── app/
│   │   ├── +layout.server.ts           # Auth guard + loads org/billing data
│   │   ├── +layout.svelte              # App shell (sidebar, nav, org switcher)
│   │   ├── dashboard/                  # Dashboard with stats + quick actions
│   │   ├── members/                    # Team management + invites
│   │   ├── activity/                   # Audit log timeline
│   │   ├── premium/                    # Billing + plan comparison
│   │   ├── settings/                   # Profile, avatar, workspace settings
│   │   ├── api-keys/                   # API key management (Pro only)
│   │   └── logout/                     # Session destruction
│   └── api/
│       ├── stripe/checkout/            # Create Stripe checkout session
│       ├── stripe/webhook/             # Handle Stripe webhook events
│       ├── stripe/portal/              # Redirect to Stripe portal
│       ├── organizations/switch/       # Switch active organization
│       ├── invites/create/             # Create team invite + send email
│       ├── invites/[inviteId]/         # Cancel invite
│       ├── members/[memberUserId]/     # Remove member
│       ├── members/[memberUserId]/role/ # Change member role
│       ├── api-keys/                   # List + create API keys
│       ├── api-keys/[keyId]/revoke/    # Revoke API key
│       └── v1/me/                      # Public API: org info (API key auth)
docs/
├── ARCHITECTURE.md                      # System design + data flow
├── CUSTOMIZATION.md                     # Step-by-step extension guides
├── API.md                               # Full API reference
└── DEPLOYMENT.md                        # Production deployment guide
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
