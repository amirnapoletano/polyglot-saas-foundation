# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`polyglot-saas-foundation` is a reusable SaaS starter kit built under the Polyglot brand. It provides auth, multi-org tenancy, billing, and a component library — designed to be cloned and extended into future SaaS products.

## Commands

```bash
npm run dev          # Start dev server (opens browser)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # TypeScript + Svelte type checking
npm run check:watch  # Type checking in watch mode
npm run lint         # Prettier + ESLint checks
npm run format       # Auto-format with Prettier
```

No test framework is configured. No CI/CD pipeline exists.

## Tech Stack

- **SvelteKit 2 + Svelte 5 + TypeScript** — app framework
- **Vite 7** — bundler
- **Tailwind CSS v4** — via `@tailwindcss/vite` plugin (no `tailwind.config.js`)
- **Supabase** — auth + database (`@supabase/ssr`)
- **Stripe** — per-org billing

## Svelte 5 Syntax (Critical)

This project uses **Svelte 5 exclusively**. Never use Svelte 4 patterns:

| Svelte 4 (DO NOT USE)          | Svelte 5 (USE THIS)              |
|--------------------------------|----------------------------------|
| `export let prop`              | `let { prop } = $props()`        |
| `<slot />`                     | `{@render children()}`           |
| `on:click={handler}`           | `onclick={handler}`              |
| `$: derived = ...`             | `let derived = $derived(...)`    |
| `let x = writable(...)`        | `let x = $state(...)`            |

## Architecture

### Request Lifecycle

1. `hooks.server.ts` — runs on every request: creates per-request Supabase client from cookies, verifies user via `getUser()` (trusted, not `getSession()`), populates `locals.user`
2. Root `+layout.server.ts` — session check, redirects (unauthenticated → `/login`, authenticated → `/app/dashboard`)
3. `app/+layout.server.ts` — auth guard: loads profile, orgs, billing, auto-repairs invalid `active_org_id`, redirects to `/onboarding` if no orgs

### Route Structure

- `/` — landing page
- `/login`, `/signup`, `/reset-password` — auth pages (use `AuthLayout.svelte`)
- `/onboarding` — first workspace creation post-signup
- `/auth/callback` — Supabase auth callback
- `/invite/[token]` — accept org invite
- `/app/*` — authenticated routes (dashboard, settings, members, premium, activity, logout)
- `/api/*` — server endpoints (stripe checkout/webhook/portal, org switch, invites, members)

### Key Modules (`src/lib/server/`)

- `supabase.ts` — per-request Supabase server client from cookies
- `billing.ts` — `getOrgBilling()`, plan detection, subscription status
- `organizations.ts` — `getUserOrganizations()`
- `team-limits.ts` — seat limits (free=3, pro=10)
- `usage.ts` — project count enforcement
- `audit.ts` — `logActivity()` to `audit_log` table (silently catches errors)

### Data Model

- **profiles** — 1:1 with `auth.users`, tracks `active_org_id`
- **organizations** + **organization_members** — multi-org, roles: owner/admin/member
- **org_billing** — one row per org, synced via Stripe webhooks
- **org_invites** — pending invites with token + expiry
- **projects** — org-scoped, used for usage limits
- **audit_log** — activity tracking (table may not exist yet)

No SQL migrations in repo — schema is managed in Supabase dashboard.

### UI Components (`src/lib/components/ui/`)

12 reusable components: Button, Input, Card, Badge, Avatar, Toast, ConfirmModal, ThemeToggle, PageHeader, EmptyState, NavProgress. Shared `AuthLayout.svelte` for auth pages.

### Design System

Tailwind v4 design tokens defined in `src/app.css` — brand colors (indigo), semantic surface/text/border tokens, dark mode via `.dark` class on `<html>`. Font: Inter.

## Environment Variables

Defined in `.env` (gitignored), template in `.env.example`:

- `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` — Supabase client config
- `SUPABASE_SERVICE_ROLE_KEY` — server-only
- `PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, `STRIPE_WEBHOOK_SECRET` — Stripe config

## Code Style

- Prettier: tabs, single quotes, print width 100
- ESLint: flat config with `typescript-eslint` + `eslint-plugin-svelte`
- Strict TypeScript (`tsconfig.json`)
- All data queries scoped by `organization_id`
- Auth uses `getUser()` (server-verified), never `getSession()` alone

## Continuity Protocol

- On startup: check for `agent-state.md` and read it if it exists
- Update `agent-state.md` regularly as work progresses
- Before context runs out: write `next-agent-instructions.md`
- New agents must read both files before doing anything else
