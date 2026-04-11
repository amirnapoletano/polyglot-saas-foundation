-- ============================================================================
-- Migration 00002: Triggers & Functions
-- Auto-create profile on signup, updated_at tracking
-- ============================================================================

-- Auto-create profile when a new user signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Auto-update updated_at on profiles
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create or replace trigger org_billing_updated_at
  before update on public.org_billing
  for each row execute function public.update_updated_at();
