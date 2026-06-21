---
name: planck-add-supabase-migration
description: Write a Supabase SQL migration with RLS policies for the PLANCK repo, in the right location and idempotent. Use when adding tables, columns, or RLS policies.
---

# Add a PLANCK Supabase migration

See AGENTS.md and the `planck-supabase` skill for full context. This skill covers file placement and the migration template.

## Where to put it

- New schema/table/policy for an existing feature → dated file under `supabase/migrations/` named `YYYYMMDD_<short_description>.sql` (today's date).
- Standalone feature SQL → a `<feature>.sql` file under `supabase/`.

## Template (new table with user-scoped RLS)

```sql
-- <description>
create table if not exists public.<table> (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz not null default now()
  -- ...your columns...
);

alter table if exists public.<table> enable row level security;

drop policy if exists "<table>_select_own" on public.<table>;
create policy "<table>_select_own"
  on public.<table> for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "<table>_insert_own" on public.<table>;
create policy "<table>_insert_own"
  on public.<table> for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "<table>_update_own" on public.<table>;
create policy "<table>_update_own"
  on public.<table> for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "<table>_delete_own" on public.<table>;
create policy "<table>_delete_own"
  on public.<table> for delete
  to authenticated
  using ((select auth.uid()) = user_id);
```

## Conventions

- **Public reads** use `to anon, authenticated` with `using (true)` (see `supabase/rls-policies.sql`).
- **Realtime** needed? Add `ALTER PUBLICATION supabase_realtime ADD TABLE <table>;` (see `supabase/enable-realtime.sql`).
- Make migrations **idempotent**: `create table if not exists`, `alter table if exists`, `drop policy if exists` before every `create policy`.
- **Never use the service role in app code as a substitute for RLS.** Write the policies.
- Reference examples: `supabase/rls-policies.sql`, `supabase/sketch-system.sql`, `supabase/insight-system.sql`, `supabase/coding-challenges.sql`, `supabase/badges-system.sql`.

## After writing

Tell the user which file(s) to run in the Supabase SQL editor and whether realtime needs enabling. Do **not** run the SQL yourself. Run `/typecheck` (pi) or `pnpm exec tsc --noEmit` if the migration is accompanied by TS changes.
