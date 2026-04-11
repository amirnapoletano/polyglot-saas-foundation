# Database Migrations

Run these migrations **in order** in your Supabase SQL Editor (Dashboard → SQL Editor), or use the Supabase CLI.

## Migration Files

| #   | File                      | Description                                                                                         |
| --- | ------------------------- | --------------------------------------------------------------------------------------------------- |
| 1   | `00001_create_tables.sql` | All core tables (profiles, organizations, members, billing, invites, projects, audit log, API keys) |
| 2   | `00002_triggers.sql`      | Auto-create profile on signup, updated_at triggers                                                  |
| 3   | `00003_rls_policies.sql`  | Row Level Security policies for all tables                                                          |
| 4   | `00004_indexes.sql`       | Performance indexes for common queries                                                              |
| 5   | `00005_storage.sql`       | Supabase Storage bucket for avatar uploads                                                          |
| 6   | `00006_seed.sql`          | Optional seed data for development                                                                  |

## Quick Setup

### Option A: Supabase Dashboard

1. Go to your Supabase project → SQL Editor
2. Run each migration file in order (00001 through 00005)
3. Optionally run 00006 for seed data

### Option B: Supabase CLI

```bash
supabase db push
```

## Resetting the Database

To start fresh during development:

```sql
-- Drop all tables (run in SQL Editor)
drop table if exists public.api_keys cascade;
drop table if exists public.audit_log cascade;
drop table if exists public.projects cascade;
drop table if exists public.org_invites cascade;
drop table if exists public.org_billing cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;

-- Then re-run migrations 00001 through 00005
```
