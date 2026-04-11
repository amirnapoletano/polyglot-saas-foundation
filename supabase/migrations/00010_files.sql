-- ============================================================================
-- Migration 00010: File Management
-- Org-scoped file uploads via Supabase Storage
-- ============================================================================

-- Files metadata table
create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade not null,
  name text not null,
  storage_path text not null,
  size_bytes bigint not null default 0,
  mime_type text,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

create index idx_files_org on public.files(organization_id, created_at desc);

alter table public.files enable row level security;

create policy "Members can view org files"
  on public.files for select
  using (
    organization_id in (
      select organization_id from public.organization_members where user_id = auth.uid()
    )
  );

create policy "Admins can manage files"
  on public.files for all
  using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Storage bucket for org files
insert into storage.buckets (id, name, public)
values ('org-files', 'org-files', false);

create policy "Org members can upload files"
  on storage.objects for insert
  with check (bucket_id = 'org-files' and auth.role() = 'authenticated');

create policy "Org members can read files"
  on storage.objects for select
  using (bucket_id = 'org-files' and auth.role() = 'authenticated');

create policy "Org members can delete files"
  on storage.objects for delete
  using (bucket_id = 'org-files' and auth.role() = 'authenticated');
