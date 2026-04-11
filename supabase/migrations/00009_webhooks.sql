-- ============================================================================
-- Migration 00009: Outgoing Webhooks
-- Let orgs register webhook URLs and track deliveries
-- ============================================================================

create table public.webhooks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  url text not null,
  secret text not null,
  events text[] not null default '{}',
  active boolean default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  webhook_id uuid references public.webhooks(id) on delete cascade not null,
  event text not null,
  payload jsonb not null,
  status_code integer,
  response_body text,
  success boolean default false,
  attempt integer default 1,
  created_at timestamptz default now()
);

create index idx_webhooks_org on public.webhooks(organization_id);
create index idx_webhook_deliveries_webhook on public.webhook_deliveries(webhook_id, created_at desc);

alter table public.webhooks enable row level security;
alter table public.webhook_deliveries enable row level security;

create policy "Members can view org webhooks"
  on public.webhooks for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Admins can manage webhooks"
  on public.webhooks for all
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "Members can view webhook deliveries"
  on public.webhook_deliveries for select
  using (
    webhook_id in (
      select w.id from public.webhooks w
      join public.organization_members om on om.organization_id = w.organization_id
      where om.user_id = auth.uid()
    )
  );
