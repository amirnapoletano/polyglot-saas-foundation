# Architecture

This document explains how the Polyglot SaaS Foundation is structured, how requests flow through the system, and how the major subsystems (auth, organizations, billing, API keys) work together.

## Tech Stack Overview

| Layer     | Technology                             |
| --------- | -------------------------------------- |
| Framework | SvelteKit 2 + Svelte 5                 |
| Language  | TypeScript (strict mode)               |
| Styling   | Tailwind CSS v4 (Vite plugin)          |
| Auth & DB | Supabase (PostgreSQL + Auth + Storage) |
| Billing   | Stripe (Checkout, Webhooks, Portal)    |
| Email     | Resend (optional in dev)               |
| Testing   | Vitest                                 |
| CI/CD     | GitHub Actions                         |
| Build     | Vite 7                                 |

## Request Lifecycle

Every request passes through these layers in order:

```
Browser Request
  │
  ▼
hooks.server.ts
  ├── 1. Create per-request Supabase client (from cookies)
  ├── 2. Expose safeGetSession() helper
  ├── 3. Populate locals.user via getUser() (server-verified)
  ├── 4. Rate limiting (auth, invites, API keys, checkout)
  ├── 5. API key auth for /api/v1/* routes (Bearer token)
  ├── 6. Call resolve(event)
  └── 7. Attach security headers to response
         │
         ▼
  Root +layout.server.ts
  ├── Calls safeGetSession()
  ├── Redirects: unauthenticated → /login
  └── Redirects: authenticated on auth pages → /app/dashboard
         │
         ▼
  /app/+layout.server.ts (for /app/* routes only)
  ├── Verifies authentication (redirects to /login if missing)
  ├── Loads profile (display_name, email, avatar_url, active_org_id)
  ├── Loads user's organization memberships
  ├── Auto-repairs invalid active_org_id
  ├── Redirects to /onboarding if user has no orgs
  ├── Fetches active org's billing state
  └── Returns: user, profile, org, billing, plan, organizations
         │
         ▼
  Page/API route handler
```

### Key Principle: Server-Verified Auth

Authentication always uses `getUser()` (which makes a server call to Supabase Auth) rather than `getSession()` alone. The session JWT can be tampered with client-side; `getUser()` validates the token server-side.

```ts
// In hooks.server.ts
const {
	data: { user },
	error
} = await event.locals.supabase.auth.getUser();
```

## Data Model

```
┌──────────────┐       ┌─────────────────────┐       ┌───────────────┐
│  auth.users  │──1:1──│      profiles        │──M:1──│ organizations │
│  (Supabase)  │       │  (active_org_id FK)  │       │               │
└──────────────┘       └─────────────────────┘       └───────┬───────┘
                                                              │
                       ┌─────────────────────┐                │
                       │ organization_members │──M:1──────────┤
                       │ (user_id, role)      │               │
                       └─────────────────────┘                │
                                                              │
                       ┌─────────────────────┐                │
                       │    org_billing       │──1:1──────────┤
                       │ (stripe_customer_id) │               │
                       └─────────────────────┘                │
                                                              │
                       ┌─────────────────────┐                │
                       │    org_invites       │──M:1──────────┤
                       │ (email, token, role) │               │
                       └─────────────────────┘                │
                                                              │
                       ┌─────────────────────┐                │
                       │     audit_log        │──M:1──────────┤
                       │ (action, metadata)   │               │
                       └─────────────────────┘                │
                                                              │
                       ┌─────────────────────┐                │
                       │     api_keys         │──M:1──────────┤
                       │ (hash, prefix)       │               │
                       └─────────────────────┘                │
                                                              │
                       ┌─────────────────────┐                │
                       │      projects        │──M:1──────────┘
                       │ (name, org-scoped)   │
                       └─────────────────────┘
```

### Tables

| Table                  | Purpose                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `profiles`             | User metadata. 1:1 with `auth.users`. Tracks `active_org_id`. Created automatically via database trigger on signup. |
| `organizations`        | Workspace/tenant. All business data is scoped to an org.                                                            |
| `organization_members` | Join table. Maps users to orgs with a role (`owner`, `admin`, `member`).                                            |
| `org_billing`          | One row per org. Synced from Stripe via webhooks. Stores subscription status, price ID, period end.                 |
| `org_invites`          | Pending team invitations. Token-based, 7-day expiry. Marked with `accepted_at` when used.                           |
| `audit_log`            | Activity tracking. Records who did what, when, in which org. JSONB metadata for context.                            |
| `api_keys`             | API key metadata. Stores SHA-256 hash (never the raw key), prefix, expiry, scopes.                                  |
| `projects`             | Org-scoped projects. Used for enforcing usage limits (free: 3, pro: unlimited).                                     |

### Row Level Security

All tables have RLS enabled. Policies ensure:

- Users can only read/write their own profile
- Organization data is only visible to members of that org
- Mutations (invite, remove member, etc.) require `owner` or `admin` role
- Billing data is read-only for members (writes happen via Stripe webhooks using the service role)

## Multi-Organization Architecture

Users can belong to multiple organizations. The `active_org_id` field on `profiles` tracks which org the user is currently working in.

### Org Switching

```
User clicks org in switcher
  → POST /api/organizations/switch { organizationId }
  → Verifies user is a member
  → Updates profiles.active_org_id
  → Client reloads (invalidateAll)
```

### Org Scoping

**Every data query in the app filters by `organization_id`**. This is the foundational multi-tenancy pattern:

```ts
const { data } = await locals.supabase
	.from('your_table')
	.select('*')
	.eq('organization_id', activeOrgId);
```

The active org ID comes from the user's profile, loaded in `app/+layout.server.ts` and passed to all child routes via the layout data.

### Auto-Repair

If a user's `active_org_id` points to an org they're no longer a member of (e.g., they were removed), the app layout automatically reassigns them to their first available org or redirects to onboarding.

## Authentication Flow

### Email/Password Signup

```
/signup form submit
  → supabase.auth.signUp({ email, password, emailRedirectTo })
  → User receives confirmation email
  → Clicks link → /auth/callback?code=...
  → exchangeCodeForSession(code)
  → Welcome email sent (if new user, via Resend)
  → Redirect to /app/dashboard (or /onboarding if no orgs)
```

### Login

```
/login form submit
  → supabase.auth.signInWithPassword({ email, password })
  → Session cookie set automatically
  → Redirect to /app/dashboard
```

### Password Reset

```
/reset-password form submit
  → supabase.auth.resetPasswordForEmail(email)
  → Supabase sends native reset email
  → User resets password via Supabase UI
```

## Billing Flow (Stripe)

### Checkout

```
User clicks "Upgrade to Pro"
  → POST /api/stripe/checkout
  → Creates/reuses Stripe customer (metadata: { organization_id })
  → Creates Checkout Session with idempotency key
  → Redirects to Stripe-hosted checkout page
  → On success → Stripe sends webhook
```

### Webhook Processing

```
Stripe → POST /api/stripe/webhook
  → Verify signature (STRIPE_WEBHOOK_SECRET)
  → Extract organization_id from customer metadata
  → Upsert org_billing row:
      subscription_id, status, price_id,
      current_period_end, cancel_at_period_end
  → Log activity (billing.subscribed / billing.updated / billing.cancelled)
```

### Handled Events

| Event                           | Action                              |
| ------------------------------- | ----------------------------------- |
| `customer.subscription.created` | Create/update `org_billing`         |
| `customer.subscription.updated` | Update status, period, cancellation |
| `customer.subscription.deleted` | Mark subscription as canceled       |
| `invoice.payment_succeeded`     | Confirm active billing              |
| `invoice.payment_failed`        | Update billing status               |

### Customer Portal

```
User clicks "Manage Billing"
  → POST /api/stripe/portal
  → Retrieves Stripe customer_id from org_billing
  → Creates portal session
  → Redirects to Stripe-hosted portal
```

### Plan Gating

Plan detection uses the Stripe price ID:

```ts
// src/lib/server/billing.ts
export function getPlanFromPriceId(priceId: string | null): 'free' | 'pro' {
	return priceId === STRIPE_PRICE_ID ? 'pro' : 'free';
}
```

Features gated by plan:

- **Seat limits**: free = 3, pro = 10 (enforced on invite creation)
- **Project limits**: free = 3, pro = unlimited
- **API keys**: pro only

## API Key Authentication

API keys provide programmatic access to `/api/v1/*` routes without user sessions.

### Key Lifecycle

```
1. Generate: crypto.randomBytes(32) → pk_live_<hex>
2. Hash: SHA-256(full_key) → stored in api_keys.key_hash
3. Store: prefix (pk_live_abc12...) saved for display, full key shown once
4. Authenticate: Bearer token → hash → lookup → verify not revoked/expired
5. Revoke: Set revoked_at timestamp (soft delete)
```

### Request Flow

```
GET /api/v1/me
Authorization: Bearer pk_live_abc123...
  │
  ▼
hooks.server.ts
  ├── Extract Bearer token
  ├── verifyApiKey(serviceRoleClient, key)
  │   ├── Hash the key
  │   ├── Look up hash in api_keys table
  │   ├── Check: not revoked, not expired
  │   └── Update last_used_at (fire-and-forget)
  ├── Set locals.apiKeyOrgId + locals.apiKeyId
  ├── Rate limit: 100 req/min per key
  └── Continue to route handler
```

The service role client is used for API key verification (bypasses RLS) since there's no user session.

## Rate Limiting

In-memory sliding window rate limiter applied in `hooks.server.ts`:

| Endpoint         | Limit       | Key        |
| ---------------- | ----------- | ---------- |
| Login / Signup   | 10 req/min  | Client IP  |
| Invite creation  | 5 req/min   | Client IP  |
| API key creation | 10 req/min  | Client IP  |
| Stripe checkout  | 10 req/min  | Client IP  |
| `/api/v1/*`      | 100 req/min | API key ID |

When the limit is exceeded, a `429 Too Many Requests` response is returned with a `Retry-After` header.

The in-memory implementation works for single-instance deployments. For multi-instance production, swap to Redis (Upstash) — see `src/lib/server/rate-limit.ts` for the upgrade path.

## Email System

Transactional email via [Resend](https://resend.com). Gracefully degrades in development:

- If `RESEND_API_KEY` is not set, emails are logged to the console instead of sent
- Two templates: welcome email (post-signup) and invite email (team invitation)
- Templates are pure TypeScript functions returning `{ subject, html }`

## Audit Logging

All significant actions are logged to the `audit_log` table:

```ts
await logActivity(locals.supabase, {
	organizationId: orgId,
	actorUserId: user.id,
	action: 'member.invited',
	resourceType: 'invite',
	metadata: { email, role }
});
```

Logging is fire-and-forget — errors are caught silently so they never break the main flow. The `action` field uses a typed union (`AuditAction`) covering 13 actions across members, invites, orgs, billing, and API keys.

## Security

### Headers (applied to every response)

| Header                   | Value                                      |
| ------------------------ | ------------------------------------------ |
| `X-Frame-Options`        | `DENY`                                     |
| `X-Content-Type-Options` | `nosniff`                                  |
| `Referrer-Policy`        | `strict-origin-when-cross-origin`          |
| `Permissions-Policy`     | `camera=(), microphone=(), geolocation=()` |

### Other Security Measures

- Server-verified auth via `getUser()` (never trust JWT alone)
- API keys stored as SHA-256 hashes (raw key never persisted)
- Stripe webhook signature verification
- Rate limiting on all sensitive endpoints
- RLS on all database tables
- CSRF protection via SvelteKit's built-in origin checking
- Open redirect prevention on auth callback (`next` param must start with `/`)

## Design System

Tailwind CSS v4 with design tokens defined in `src/app.css`:

- **Brand colors**: Indigo palette (`--color-brand-50` through `--color-brand-900`)
- **Semantic tokens**: `--color-surface`, `--color-text-primary`, `--color-border`, `--color-success`, `--color-error`, etc.
- **Dark mode**: CSS variable overrides when `.dark` class is on `<html>`
- **Font**: Inter (via Google Fonts)
- **Border radius tokens**: `--radius-sm` through `--radius-xl`

12 reusable UI components in `src/lib/components/ui/`: Button, Input, Card, Badge, Avatar, Toast, ConfirmModal, ThemeToggle, PageHeader, EmptyState, NavProgress.

## CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push to `main` and on PRs:

1. **Check job**: Prettier → ESLint → svelte-check → production build
2. **Test job**: Vitest unit tests

Both jobs use Node 20 and run in parallel.
