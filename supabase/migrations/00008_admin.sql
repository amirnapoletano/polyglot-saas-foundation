-- ============================================================================
-- Migration 00008: Admin System
-- Super admin flag and feature flags tables
-- ============================================================================

-- Add super_admin flag to profiles
alter table public.profiles
  add column if not exists is_super_admin boolean default false;

-- Feature flags (global + per-org)
create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  description text,
  enabled boolean default false,
  organization_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_feature_flags_key on public.feature_flags(key);
create index idx_feature_flags_org on public.feature_flags(organization_id);

alter table public.feature_flags enable row level security;

-- Only super admins can manage feature flags (via service role in practice)
create policy "Super admins can manage feature flags"
  on public.feature_flags for all
  using (
    exists (select 1 from public.profiles where id = auth.uid() and is_super_admin = true)
  );

-- Everyone can read enabled flags relevant to their org
create policy "Users can read feature flags"
  on public.feature_flags for select
  using (
    organization_id is null
    or organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );
