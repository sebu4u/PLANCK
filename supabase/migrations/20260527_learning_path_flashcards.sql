-- Flashcard system for learning path struggle recovery.

create table if not exists public.user_flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.learning_path_lesson_items(id) on delete cascade,
  lesson_id uuid not null references public.learning_path_lessons(id) on delete cascade,
  chapter_id uuid references public.learning_path_chapters(id) on delete set null,
  front_text text not null,
  back_text text not null,
  source_item_type text,
  know_count int not null default 0,
  dont_know_count int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_user_flashcards_user_id
  on public.user_flashcards(user_id);

create index if not exists idx_user_flashcards_item_id
  on public.user_flashcards(item_id);

create index if not exists idx_user_flashcards_lesson_id
  on public.user_flashcards(lesson_id);

create table if not exists public.user_learning_path_flashcard_offers (
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.learning_path_lesson_items(id) on delete cascade,
  last_offered_at timestamptz not null default now(),
  last_status text not null check (last_status in ('started', 'skipped', 'completed')),
  cards_generated int not null default 0,
  primary key (user_id, item_id)
);

create table if not exists public.user_flashcard_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  item_id uuid not null references public.learning_path_lesson_items(id) on delete cascade,
  next_item_href text not null,
  status text not null check (status in ('active', 'completed')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_user_flashcard_sessions_user_id
  on public.user_flashcard_sessions(user_id);

create table if not exists public.user_flashcard_session_cards (
  session_id uuid not null references public.user_flashcard_sessions(id) on delete cascade,
  flashcard_id uuid not null references public.user_flashcards(id) on delete cascade,
  order_index int not null,
  self_assessment text check (self_assessment in ('knew', 'didnt_know')),
  reviewed_at timestamptz,
  primary key (session_id, flashcard_id)
);

create table if not exists public.user_flashcard_daily_generations (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_date date not null default (timezone('utc', now()))::date,
  generation_count int not null default 0,
  primary key (user_id, usage_date)
);

-- RLS
alter table public.user_flashcards enable row level security;
alter table public.user_learning_path_flashcard_offers enable row level security;
alter table public.user_flashcard_sessions enable row level security;
alter table public.user_flashcard_session_cards enable row level security;
alter table public.user_flashcard_daily_generations enable row level security;

create policy "user_flashcards_select_own"
  on public.user_flashcards for select to authenticated
  using (auth.uid() = user_id);

create policy "user_flashcards_insert_own"
  on public.user_flashcards for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_flashcards_update_own"
  on public.user_flashcards for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_lp_flashcard_offers_select_own"
  on public.user_learning_path_flashcard_offers for select to authenticated
  using (auth.uid() = user_id);

create policy "user_lp_flashcard_offers_insert_own"
  on public.user_learning_path_flashcard_offers for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_lp_flashcard_offers_update_own"
  on public.user_learning_path_flashcard_offers for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_flashcard_sessions_select_own"
  on public.user_flashcard_sessions for select to authenticated
  using (auth.uid() = user_id);

create policy "user_flashcard_sessions_insert_own"
  on public.user_flashcard_sessions for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_flashcard_sessions_update_own"
  on public.user_flashcard_sessions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "user_flashcard_session_cards_select_own"
  on public.user_flashcard_session_cards for select to authenticated
  using (
    exists (
      select 1 from public.user_flashcard_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "user_flashcard_session_cards_insert_own"
  on public.user_flashcard_session_cards for insert to authenticated
  with check (
    exists (
      select 1 from public.user_flashcard_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "user_flashcard_session_cards_update_own"
  on public.user_flashcard_session_cards for update to authenticated
  using (
    exists (
      select 1 from public.user_flashcard_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.user_flashcard_sessions s
      where s.id = session_id and s.user_id = auth.uid()
    )
  );

create policy "user_flashcard_daily_generations_select_own"
  on public.user_flashcard_daily_generations for select to authenticated
  using (auth.uid() = user_id);

create policy "user_flashcard_daily_generations_insert_own"
  on public.user_flashcard_daily_generations for insert to authenticated
  with check (auth.uid() = user_id);

create policy "user_flashcard_daily_generations_update_own"
  on public.user_flashcard_daily_generations for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update on public.user_flashcards to authenticated;
grant select, insert, update on public.user_learning_path_flashcard_offers to authenticated;
grant select, insert, update on public.user_flashcard_sessions to authenticated;
grant select, insert, update on public.user_flashcard_session_cards to authenticated;
grant select, insert, update on public.user_flashcard_daily_generations to authenticated;

create or replace function public.should_offer_learning_path_flashcards(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_last_offered_at timestamptz;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    return false;
  end if;

  select last_offered_at
  into v_last_offered_at
  from public.user_learning_path_flashcard_offers
  where user_id = v_user_id and item_id = p_item_id;

  if v_last_offered_at is null then
    return true;
  end if;

  return v_last_offered_at < now() - interval '7 days';
end;
$$;

grant execute on function public.should_offer_learning_path_flashcards(uuid) to authenticated;
