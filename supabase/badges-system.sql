-- Sistem de gamification pentru badge-uri
-- Tabela pentru badge-uri
create table if not exists public.badges (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  icon text not null,
  required_problems integer not null,
  color text not null,
  created_at timestamp with time zone default now()
);

-- Tabela pentru badge-urile câștigate de utilizatori
create table if not exists public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  badge_id uuid references public.badges(id) on delete cascade,
  earned_at timestamp with time zone default now(),
  unique(user_id, badge_id)
);

-- Inserarea badge-urilor predefinite
insert into public.badges (name, description, icon, required_problems, color) values
  ('Începător', 'Ai rezolvat prima ta problemă!', '🌱', 1, 'bg-green-500'),
  ('Novice Fizician', 'Ai rezolvat 5 probleme!', '🔬', 5, 'bg-blue-500'),
  ('Apprentice', 'Ai rezolvat 10 probleme!', '📚', 10, 'bg-purple-500'),
  ('Problema Buster', 'Ai rezolvat 25 de probleme!', '💪', 25, 'bg-orange-500'),
  ('Cercetător Junior', 'Ai rezolvat 50 de probleme!', '🔍', 50, 'bg-indigo-500'),
  ('Experimentator', 'Ai rezolvat 100 de probleme!', '🧪', 100, 'bg-pink-500'),
  ('Maestru al problemelor', 'Ai rezolvat 200 de probleme!', '👑', 200, 'bg-yellow-500'),
  ('Fizician Expert', 'Ai rezolvat 300 de probleme!', '⚡', 300, 'bg-red-500'),
  ('Omul de știință', 'Ai rezolvat 400 de probleme!', '🔬', 400, 'bg-teal-500'),
  ('Legendă PLANCK', 'Ai rezolvat 500 de probleme!', '🌟', 500, 'bg-gradient-to-r from-purple-600 to-pink-600')
on conflict (name) do nothing;

-- Funcție pentru verificarea și acordarea badge-urilor
create or replace function public.check_and_award_badges(user_uuid uuid)
returns void as $$
declare
  solved_count integer;
  badge_record record;
begin
  -- Numără problemele rezolvate de utilizator
  select count(*) into solved_count
  from public.solved_problems
  where user_id = user_uuid;
  
  -- Verifică fiecare badge și acordă-l dacă utilizatorul îndeplinește condițiile
  for badge_record in
    select * from public.badges
    where required_problems <= solved_count
  loop
    -- Încearcă să insereze badge-ul (ignoră dacă deja există)
    insert into public.user_badges (user_id, badge_id)
    values (user_uuid, badge_record.id)
    on conflict (user_id, badge_id) do nothing;
  end loop;
end;
$$ language plpgsql security definer;

-- Trigger pentru a verifica badge-urile când o problemă este marcată ca rezolvată
-- Acordă și ELO pentru problema rezolvată
create or replace function public.handle_problem_solved()
returns trigger as $$
begin
  raise notice 'Trigger declanșat pentru user: % și problem: %', NEW.user_id, NEW.problem_id;
  
  -- Acordă ELO pentru problema rezolvată (actualizează user_stats, daily_activity, streak, badge-uri)
  -- Convert problem_id to text if needed
  perform public.award_elo_for_problem(new.user_id, new.problem_id::text);
  return new;
exception
  when others then
    -- Log error but don't fail the insert
    raise notice 'EROARE în handle_problem_solved: %', SQLERRM;
    return new;
end;
$$ language plpgsql security definer;

-- Creează trigger-ul dacă nu există
drop trigger if exists on_problem_solved on public.solved_problems;
create trigger on_problem_solved
  after insert on public.solved_problems
  for each row execute procedure public.handle_problem_solved();

-- RLS Policies pentru badge-uri
alter table if exists public.badges enable row level security;
alter table if exists public.user_badges enable row level security;

-- Badge-urile sunt publice (toată lumea poate să le vadă)
drop policy if exists "badges_select_public" on public.badges;
create policy "badges_select_public"
  on public.badges for select
  to anon, authenticated
  using (true);

-- Utilizatorii pot vedea doar propriile badge-uri câștigate
drop policy if exists "user_badges_select_own" on public.user_badges;
create policy "user_badges_select_own"
  on public.user_badges for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

-- Doar sistemul poate insera badge-uri pentru utilizatori
drop policy if exists "user_badges_insert_system" on public.user_badges;
create policy "user_badges_insert_system"
  on public.user_badges for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);
