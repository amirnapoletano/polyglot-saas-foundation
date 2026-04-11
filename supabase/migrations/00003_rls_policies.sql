-- ============================================================================
-- Migration 00003: Row Level Security Policies
-- Enable RLS on all tables and define access rules
-- ============================================================================

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.org_billing enable row level security;
alter table public.org_invites enable row level security;
alter table public.projects enable row level security;
alter table public.audit_log enable row level security;
alter table public.api_keys enable row level security;

-- ── Profiles ──────────────────────────────────────────────────────────────────
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- ── Organizations ─────────────────────────────────────────────────────────────
create policy "Members can view their organizations"
  on public.organizations for select
  using (
    id in (select organization_id from public.organization_members where user_id = auth.uid())
  );

create policy "Authenticated users can create organizations"
  on public.organizations for insert
  with check (auth.uid() = created_by);

-- ── Organization Members ──────────────────────────────────────────────────────
create policy "Members can view org members"
  on public.organization_members for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage members"
  on public.organization_members for all
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ── Organization Billing ──────────────────────────────────────────────────────
create policy "Members can view org billing"
  on public.org_billing for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- ── Organization Invites ──────────────────────────────────────────────────────
create policy "Members can view org invites"
  on public.org_invites for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

-- ── Projects ──────────────────────────────────────────────────────────────────
create policy "Members can view org projects"
  on public.projects for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Owners and admins can manage projects"
  on public.projects for all
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- ── Audit Log ─────────────────────────────────────────────────────────────────
create policy "Members can view audit log"
  on public.audit_log for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Authenticated users can insert audit log"
  on public.audit_log for insert
  with check (auth.uid() = actor_user_id);

-- ── API Keys ──────────────────────────────────────────────────────────────────
create policy "Members can view org API keys"
  on public.api_keys for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Admins and owners can manage API keys"
  on public.api_keys for all
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );
