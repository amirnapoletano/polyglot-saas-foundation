-- ============================================================================
-- Migration 00001: Core Tables
-- Creates all foundation tables for the Polyglot SaaS starter
-- ============================================================================

-- Profiles (auto-created on signup via trigger)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  plan text default 'free',
  active_org_id uuid,
  onboarding_completed boolean default false,
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

-- Organization Billing (one per org, synced via Stripe webhooks)
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
  invited_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  created_at timestamptz default now(),
  accepted_at timestamptz
);

-- Projects (for usage/quota limits)
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

-- API Keys (Pro plan feature, hashed storage)
create table public.api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  key_hash text not null unique,
  key_prefix text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  revoked_at timestamptz,
  expires_at timestamptz,
  last_used_at timestamptz,
  scopes text[]
);

-- Foreign key: profiles.active_org_id -> organizations.id
alter table public.profiles
  add constraint profiles_active_org_fk
  foreign key (active_org_id)
  references public.organizations(id)
  on delete set null;
