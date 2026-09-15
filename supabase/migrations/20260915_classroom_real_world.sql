-- Classroom product for real school rooms: trust, assignment lifecycle, tests,
-- live hour, school org, parent messages. Idempotent.

-- ---------------------------------------------------------------------------
-- Classrooms: metadata, archive, join lock, school
-- ---------------------------------------------------------------------------
alter table if exists public.classrooms
  add column if not exists archived_at timestamptz,
  add column if not exists join_locked boolean not null default false,
  add column if not exists subject text,
  add column if not exists grade_level text,
  add column if not exists section text,
  add column if not exists school_year text,
  add column if not exists school_id uuid;

alter table if exists public.classrooms
  drop constraint if exists classrooms_subject_check;
alter table if exists public.classrooms
  add constraint classrooms_subject_check
  check (
    subject is null
    or subject in ('matematica', 'fizica', 'informatica', 'chimie', 'biologie')
  );

alter table if exists public.classrooms
  drop constraint if exists classrooms_grade_level_check;
alter table if exists public.classrooms
  add constraint classrooms_grade_level_check
  check (
    grade_level is null
    or grade_level in ('IX', 'X', 'XI', 'XII')
  );

create index if not exists idx_classrooms_archived_at
  on public.classrooms (archived_at)
  where archived_at is not null;

create index if not exists idx_classrooms_school_id
  on public.classrooms (school_id)
  where school_id is not null;

-- ---------------------------------------------------------------------------
-- Announcements: pin
-- ---------------------------------------------------------------------------
alter table if exists public.announcements
  add column if not exists pinned_at timestamptz;

create index if not exists idx_announcements_pinned
  on public.announcements (classroom_id, pinned_at desc)
  where pinned_at is not null;

-- ---------------------------------------------------------------------------
-- Assignments: lifecycle, tests, late policy, windows
-- ---------------------------------------------------------------------------
alter table if exists public.assignments
  add column if not exists status text not null default 'published',
  add column if not exists kind text not null default 'homework',
  add column if not exists late_policy text not null default 'accept',
  add column if not exists window_start timestamptz,
  add column if not exists window_end timestamptz,
  add column if not exists time_limit_minutes integer,
  add column if not exists shuffle_options boolean not null default false,
  add column if not exists allow_catalog_sync boolean not null default true,
  add column if not exists source_assignment_id uuid references public.assignments(id) on delete set null,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists closed_notified_at timestamptz;

alter table if exists public.assignments
  drop constraint if exists assignments_status_check;
alter table if exists public.assignments
  add constraint assignments_status_check
  check (status in ('draft', 'published', 'closed'));

alter table if exists public.assignments
  drop constraint if exists assignments_kind_check;
alter table if exists public.assignments
  add constraint assignments_kind_check
  check (kind in ('homework', 'test'));

alter table if exists public.assignments
  drop constraint if exists assignments_late_policy_check;
alter table if exists public.assignments
  add constraint assignments_late_policy_check
  check (late_policy in ('accept', 'mark_late', 'block'));

create index if not exists idx_assignments_status
  on public.assignments (classroom_id, status, created_at desc);

create index if not exists idx_assignments_kind
  on public.assignments (classroom_id, kind);

create index if not exists idx_assignments_deadline_reminder
  on public.assignments (deadline)
  where status = 'published' and deadline is not null and reminder_sent_at is null;

-- ---------------------------------------------------------------------------
-- Submissions: teacher feedback, late, attempts
-- ---------------------------------------------------------------------------
alter table if exists public.submissions
  add column if not exists teacher_comment text,
  add column if not exists teacher_grade numeric(3, 1),
  add column if not exists is_late boolean not null default false,
  add column if not exists attempt_count integer not null default 1;

alter table if exists public.submissions
  drop constraint if exists submissions_teacher_grade_check;
alter table if exists public.submissions
  add constraint submissions_teacher_grade_check
  check (
    teacher_grade is null
    or (teacher_grade >= 1 and teacher_grade <= 10)
  );

create table if not exists public.submission_attempts (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  answer text not null,
  is_correct boolean not null default false,
  submitted_at timestamptz not null default timezone('utc'::text, now()),
  attempt_number integer not null default 1
);

create index if not exists idx_submission_attempts_submission_id
  on public.submission_attempts (submission_id, attempt_number desc);

create table if not exists public.assignment_starts (
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc'::text, now()),
  tab_blur_count integer not null default 0,
  primary key (assignment_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Live hour
-- ---------------------------------------------------------------------------
create table if not exists public.classroom_sessions (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  started_by uuid not null references auth.users(id) on delete cascade,
  started_at timestamptz not null default timezone('utc'::text, now()),
  ended_at timestamptz,
  status text not null default 'active' check (status in ('active', 'ended')),
  current_problem_id text,
  assignment_id uuid references public.assignments(id) on delete set null,
  exit_ticket_assignment_id uuid references public.assignments(id) on delete set null
);

create index if not exists idx_classroom_sessions_classroom
  on public.classroom_sessions (classroom_id, started_at desc);

create unique index if not exists idx_classroom_sessions_one_active
  on public.classroom_sessions (classroom_id)
  where status = 'active';

create table if not exists public.classroom_session_attendance (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.classroom_sessions(id) on delete cascade,
  student_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'present' check (status in ('present', 'absent', 'late')),
  marked_at timestamptz not null default timezone('utc'::text, now()),
  marked_by uuid references auth.users(id) on delete set null,
  unique (session_id, student_id)
);

create index if not exists idx_classroom_session_attendance_session
  on public.classroom_session_attendance (session_id);

-- ---------------------------------------------------------------------------
-- School org
-- ---------------------------------------------------------------------------
create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 160),
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.school_members (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'teacher')),
  joined_at timestamptz not null default timezone('utc'::text, now()),
  unique (school_id, user_id)
);

create index if not exists idx_school_members_user_id
  on public.school_members (user_id);

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'classrooms_school_id_fkey'
  ) then
    alter table public.classrooms
      add constraint classrooms_school_id_fkey
      foreign key (school_id) references public.schools(id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Invites (co-teacher + CSV students who do not have an account yet)
-- ---------------------------------------------------------------------------
create table if not exists public.classroom_invites (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null check (role in ('teacher', 'student')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  accepted_at timestamptz,
  unique (classroom_id, email, role)
);

create index if not exists idx_classroom_invites_email
  on public.classroom_invites (lower(email))
  where accepted_at is null;

-- ---------------------------------------------------------------------------
-- Parent messages
-- ---------------------------------------------------------------------------
create table if not exists public.classroom_parent_messages (
  id uuid primary key default gen_random_uuid(),
  classroom_id uuid not null references public.classrooms(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  student_id uuid references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists idx_classroom_parent_messages_classroom
  on public.classroom_parent_messages (classroom_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Teacher check: membership role OR owner
-- ---------------------------------------------------------------------------
create or replace function public.is_classroom_teacher(
  target_classroom uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_user is not null
    and (
      exists (
        select 1
        from public.classroom_members cm
        where cm.classroom_id = target_classroom
          and cm.user_id = target_user
          and cm.role = 'teacher'
      )
      or exists (
        select 1
        from public.classrooms c
        where c.id = target_classroom
          and c.teacher_id = target_user
      )
    );
$$;

create or replace function public.is_classroom_owner(
  target_classroom uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.classrooms c
    where c.id = target_classroom
      and c.teacher_id = target_user
  );
$$;

create or replace function public.is_school_admin(
  target_school uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_members sm
    where sm.school_id = target_school
      and sm.user_id = target_user
      and sm.role = 'admin'
  );
$$;

create or replace function public.is_school_member(
  target_school uuid,
  target_user uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.school_members sm
    where sm.school_id = target_school
      and sm.user_id = target_user
  );
$$;

-- ---------------------------------------------------------------------------
-- Join by code (no UUID insert without code)
-- ---------------------------------------------------------------------------
create or replace function public.join_classroom(p_join_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_classroom public.classrooms%rowtype;
  v_role text;
  v_email text;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select *
    into v_classroom
  from public.classrooms
  where join_code = upper(trim(p_join_code));

  if not found then
    raise exception 'classroom_not_found';
  end if;

  if v_classroom.archived_at is not null then
    raise exception 'classroom_archived';
  end if;

  if exists (
    select 1
    from public.classroom_members cm
    where cm.classroom_id = v_classroom.id
      and cm.user_id = v_uid
  ) then
    return v_classroom.id;
  end if;

  if v_classroom.join_locked and v_classroom.teacher_id <> v_uid then
    raise exception 'join_locked';
  end if;

  v_role := case when v_classroom.teacher_id = v_uid then 'teacher' else 'student' end;

  insert into public.classroom_members (classroom_id, user_id, role)
  values (v_classroom.id, v_uid, v_role)
  on conflict (classroom_id, user_id) do nothing;

  select lower(u.email) into v_email
  from auth.users u
  where u.id = v_uid;

  if v_email is not null then
    update public.classroom_invites
    set accepted_at = timezone('utc'::text, now())
    where classroom_id = v_classroom.id
      and lower(email) = v_email
      and accepted_at is null;
  end if;

  return v_classroom.id;
end;
$$;

revoke all on function public.join_classroom(text) from public;
grant execute on function public.join_classroom(text) to authenticated;

create or replace function public.find_user_ids_by_emails(p_emails text[])
returns table (user_id uuid, email text)
language sql
security definer
set search_path = public, auth
as $$
  select u.id, lower(u.email)
  from auth.users u
  where u.email is not null
    and lower(u.email) = any (
      select lower(trim(e)) from unnest(p_emails) as e where trim(e) <> ''
    );
$$;

revoke all on function public.find_user_ids_by_emails(text[]) from public;
grant execute on function public.find_user_ids_by_emails(text[]) to service_role;

-- ---------------------------------------------------------------------------
-- Create-class gate: only profesor
-- ---------------------------------------------------------------------------
drop policy if exists "classrooms_insert_teacher" on public.classrooms;
create policy "classrooms_insert_teacher"
  on public.classrooms
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and teacher_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and p.user_type = 'profesor'
    )
  );

-- Students can no longer insert membership by classroom UUID.
drop policy if exists "classroom_members_insert_student_row" on public.classroom_members;
create policy "classroom_members_insert_student_row"
  on public.classroom_members
  for insert
  to authenticated
  with check (
    auth.uid() is not null
    and user_id = auth.uid()
    and role = 'student'
    and public.is_classroom_teacher(classroom_id, auth.uid())
  );

-- Co-teachers may leave (owner still blocked in app). Allow delete of own teacher row
-- except owner.
drop policy if exists "classroom_members_delete_teacher_or_self" on public.classroom_members;
create policy "classroom_members_delete_teacher_or_self"
  on public.classroom_members
  for delete
  to authenticated
  using (
    (
      auth.uid() = user_id
      and not public.is_classroom_owner(classroom_id, auth.uid())
    )
    or (
      public.is_classroom_teacher(classroom_id)
      and role = 'student'
    )
  );

-- Announcement pin/edit/delete by any class teacher
drop policy if exists "announcements_update_teacher" on public.announcements;
create policy "announcements_update_teacher"
  on public.announcements
  for update
  to authenticated
  using (public.is_classroom_teacher(classroom_id))
  with check (public.is_classroom_teacher(classroom_id));

drop policy if exists "announcements_delete_teacher" on public.announcements;
create policy "announcements_delete_teacher"
  on public.announcements
  for delete
  to authenticated
  using (public.is_classroom_teacher(classroom_id));

-- ---------------------------------------------------------------------------
-- Grants + RLS for new tables
-- ---------------------------------------------------------------------------
grant select, insert, update, delete on table public.submission_attempts to authenticated;
grant select, insert, update on table public.assignment_starts to authenticated;
grant select, insert, update on table public.classroom_sessions to authenticated;
grant select, insert, update, delete on table public.classroom_session_attendance to authenticated;
grant select, insert, update on table public.schools to authenticated;
grant select, insert, update, delete on table public.school_members to authenticated;
grant select, insert, update, delete on table public.classroom_invites to authenticated;
grant select, insert on table public.classroom_parent_messages to authenticated;

alter table if exists public.submission_attempts enable row level security;
alter table if exists public.assignment_starts enable row level security;
alter table if exists public.classroom_sessions enable row level security;
alter table if exists public.classroom_session_attendance enable row level security;
alter table if exists public.schools enable row level security;
alter table if exists public.school_members enable row level security;
alter table if exists public.classroom_invites enable row level security;
alter table if exists public.classroom_parent_messages enable row level security;

drop policy if exists "submission_attempts_select" on public.submission_attempts;
create policy "submission_attempts_select"
  on public.submission_attempts for select to authenticated
  using (
    exists (
      select 1
      from public.submissions s
      join public.assignments a on a.id = s.assignment_id
      where s.id = submission_id
        and (
          s.student_id = auth.uid()
          or public.is_classroom_teacher(a.classroom_id)
        )
    )
  );

drop policy if exists "submission_attempts_insert_student" on public.submission_attempts;
create policy "submission_attempts_insert_student"
  on public.submission_attempts for insert to authenticated
  with check (
    exists (
      select 1 from public.submissions s
      where s.id = submission_id and s.student_id = auth.uid()
    )
  );

drop policy if exists "assignment_starts_select" on public.assignment_starts;
create policy "assignment_starts_select"
  on public.assignment_starts for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_classroom_teacher(a.classroom_id)
    )
  );

drop policy if exists "assignment_starts_insert_student" on public.assignment_starts;
create policy "assignment_starts_insert_student"
  on public.assignment_starts for insert to authenticated
  with check (student_id = auth.uid());

drop policy if exists "assignment_starts_update_student" on public.assignment_starts;
create policy "assignment_starts_update_student"
  on public.assignment_starts for update to authenticated
  using (student_id = auth.uid())
  with check (student_id = auth.uid());

drop policy if exists "classroom_sessions_select_members" on public.classroom_sessions;
create policy "classroom_sessions_select_members"
  on public.classroom_sessions for select to authenticated
  using (public.is_classroom_member(classroom_id));

drop policy if exists "classroom_sessions_insert_teacher" on public.classroom_sessions;
create policy "classroom_sessions_insert_teacher"
  on public.classroom_sessions for insert to authenticated
  with check (public.is_classroom_teacher(classroom_id) and started_by = auth.uid());

drop policy if exists "classroom_sessions_update_teacher" on public.classroom_sessions;
create policy "classroom_sessions_update_teacher"
  on public.classroom_sessions for update to authenticated
  using (public.is_classroom_teacher(classroom_id))
  with check (public.is_classroom_teacher(classroom_id));

drop policy if exists "classroom_session_attendance_select" on public.classroom_session_attendance;
create policy "classroom_session_attendance_select"
  on public.classroom_session_attendance for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.classroom_sessions s
      where s.id = session_id and public.is_classroom_teacher(s.classroom_id)
    )
  );

drop policy if exists "classroom_session_attendance_teacher" on public.classroom_session_attendance;
create policy "classroom_session_attendance_teacher"
  on public.classroom_session_attendance for insert to authenticated
  with check (
    exists (
      select 1 from public.classroom_sessions s
      where s.id = session_id and public.is_classroom_teacher(s.classroom_id)
    )
  );

drop policy if exists "classroom_session_attendance_update" on public.classroom_session_attendance;
create policy "classroom_session_attendance_update"
  on public.classroom_session_attendance for update to authenticated
  using (
    exists (
      select 1 from public.classroom_sessions s
      where s.id = session_id and public.is_classroom_teacher(s.classroom_id)
    )
  )
  with check (
    exists (
      select 1 from public.classroom_sessions s
      where s.id = session_id and public.is_classroom_teacher(s.classroom_id)
    )
  );

drop policy if exists "schools_select_member" on public.schools;
create policy "schools_select_member"
  on public.schools for select to authenticated
  using (public.is_school_member(id));

drop policy if exists "schools_insert_own" on public.schools;
create policy "schools_insert_own"
  on public.schools for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "schools_update_admin" on public.schools;
create policy "schools_update_admin"
  on public.schools for update to authenticated
  using (public.is_school_admin(id))
  with check (public.is_school_admin(id));

drop policy if exists "school_members_select" on public.school_members;
create policy "school_members_select"
  on public.school_members for select to authenticated
  using (public.is_school_member(school_id) or user_id = auth.uid());

drop policy if exists "school_members_insert_admin_or_self_creator" on public.school_members;
create policy "school_members_insert_admin_or_self_creator"
  on public.school_members for insert to authenticated
  with check (
    user_id = auth.uid()
    or public.is_school_admin(school_id)
  );

drop policy if exists "school_members_delete_admin" on public.school_members;
create policy "school_members_delete_admin"
  on public.school_members for delete to authenticated
  using (public.is_school_admin(school_id) or user_id = auth.uid());

drop policy if exists "classroom_invites_select_teacher" on public.classroom_invites;
create policy "classroom_invites_select_teacher"
  on public.classroom_invites for select to authenticated
  using (public.is_classroom_teacher(classroom_id));

drop policy if exists "classroom_invites_insert_teacher" on public.classroom_invites;
create policy "classroom_invites_insert_teacher"
  on public.classroom_invites for insert to authenticated
  with check (public.is_classroom_teacher(classroom_id) and invited_by = auth.uid());

drop policy if exists "classroom_invites_update_teacher" on public.classroom_invites;
create policy "classroom_invites_update_teacher"
  on public.classroom_invites for update to authenticated
  using (public.is_classroom_teacher(classroom_id))
  with check (public.is_classroom_teacher(classroom_id));

drop policy if exists "classroom_invites_delete_teacher" on public.classroom_invites;
create policy "classroom_invites_delete_teacher"
  on public.classroom_invites for delete to authenticated
  using (public.is_classroom_teacher(classroom_id));

drop policy if exists "classroom_parent_messages_select" on public.classroom_parent_messages;
create policy "classroom_parent_messages_select"
  on public.classroom_parent_messages for select to authenticated
  using (
    public.is_classroom_teacher(classroom_id)
    or exists (
      select 1
      from public.parent_child_relationships pcr
      join public.classroom_members cm
        on cm.user_id = pcr.child_id
       and cm.classroom_id = classroom_parent_messages.classroom_id
       and cm.role = 'student'
      where pcr.parent_id = auth.uid()
        and pcr.status = 'active'
        and (
          classroom_parent_messages.student_id is null
          or classroom_parent_messages.student_id = pcr.child_id
        )
    )
  );

drop policy if exists "classroom_parent_messages_insert_teacher" on public.classroom_parent_messages;
create policy "classroom_parent_messages_insert_teacher"
  on public.classroom_parent_messages for insert to authenticated
  with check (
    author_id = auth.uid()
    and public.is_classroom_teacher(classroom_id)
  );

-- ---------------------------------------------------------------------------
-- In-app notification types
-- ---------------------------------------------------------------------------
alter table public.user_in_app_notifications
  drop constraint if exists user_in_app_notifications_type_check;

alter table public.user_in_app_notifications
  add constraint user_in_app_notifications_type_check
  check (type in (
    'workshop_reminder',
    'classroom_assignment',
    'classroom_announcement',
    'classroom_assignment_reminder',
    'classroom_assignment_closed',
    'classroom_parent_message'
  ));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'submissions'
  ) then
    execute 'alter publication supabase_realtime add table public.submissions';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'classroom_sessions'
  ) then
    execute 'alter publication supabase_realtime add table public.classroom_sessions';
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'classroom_session_attendance'
  ) then
    execute 'alter publication supabase_realtime add table public.classroom_session_attendance';
  end if;
end $$;
