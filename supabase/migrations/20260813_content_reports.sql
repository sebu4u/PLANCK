-- Content issue reports: user-submitted problems on learning-path items, problems, grile, and course lessons.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  issue_type text not null,
  description text not null,
  screenshot_path text not null,
  source_type text not null,
  source_id text not null,
  source_url text not null,
  source_meta jsonb not null default '{}'::jsonb,
  status text not null default 'open',
  admin_notes text,
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null,
  constraint content_reports_issue_type_check check (
    issue_type in (
      'enunt_gresit',
      'raspuns_gresit',
      'imagine_gresita',
      'formatare',
      'continut_lipsa',
      'altceva'
    )
  ),
  constraint content_reports_source_type_check check (
    source_type in (
      'learning_path_item',
      'physics_problem',
      'math_problem',
      'coding_problem',
      'grila',
      'course_lesson'
    )
  ),
  constraint content_reports_status_check check (
    status in ('open', 'in_progress', 'resolved', 'dismissed')
  )
);

create index if not exists content_reports_created_at_idx
  on public.content_reports (created_at desc);

create index if not exists content_reports_status_idx
  on public.content_reports (status);

create index if not exists content_reports_source_type_idx
  on public.content_reports (source_type);

create index if not exists content_reports_user_id_idx
  on public.content_reports (user_id);

alter table if exists public.content_reports enable row level security;

drop policy if exists "content_reports_select_own" on public.content_reports;
create policy "content_reports_select_own"
  on public.content_reports for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "content_reports_insert_own" on public.content_reports;
create policy "content_reports_insert_own"
  on public.content_reports for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public)
values ('content-reports', 'content-reports', false)
on conflict (id) do update
set public = excluded.public;

-- Path: {user_id}/{filename}
drop policy if exists "content_reports_storage_select_own" on storage.objects;
create policy "content_reports_storage_select_own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'content-reports'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

drop policy if exists "content_reports_storage_insert_own" on storage.objects;
create policy "content_reports_storage_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'content-reports'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );
