-- ============================================================================
-- Migration 00004: Indexes
-- Performance indexes for common queries
-- ============================================================================

-- Organization members: fast lookups by user and org
create index idx_org_members_user_id on public.organization_members(user_id);
create index idx_org_members_org_id on public.organization_members(organization_id);

-- Invites: lookup by token (accept flow) and org (list pending)
create index idx_org_invites_token on public.org_invites(token);
create index idx_org_invites_org_id on public.org_invites(organization_id);
create index idx_org_invites_email on public.org_invites(email);

-- Audit log: recent activity per org
create index idx_audit_log_org_created on public.audit_log(organization_id, created_at desc);

-- API keys: lookup by hash (auth flow) and org (list keys)
create index idx_api_keys_key_hash on public.api_keys(key_hash);
create index idx_api_keys_org_id on public.api_keys(organization_id);

-- Projects: per-org listing
create index idx_projects_org_id on public.projects(organization_id);

-- Billing: lookup by stripe customer ID (webhook handling)
create index idx_org_billing_stripe_customer on public.org_billing(stripe_customer_id);

-- Profiles: lookup by active org
create index idx_profiles_active_org on public.profiles(active_org_id);
