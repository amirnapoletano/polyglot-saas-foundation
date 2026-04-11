-- ============================================================================
-- Migration 00007: Notifications
-- In-app notification system for org events
-- ============================================================================

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz default now()
);

create index idx_notifications_user_unread
  on public.notifications(user_id, created_at desc)
  where read_at is null;

create index idx_notifications_user_id
  on public.notifications(user_id, created_at desc);

-- RLS
alter table public.notifications enable row level security;

create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Users can update own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete own notifications"
  on public.notifications for delete
  using (auth.uid() = user_id);
