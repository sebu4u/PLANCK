-- Sketch Board Functions System Schema
-- Stores mathematical functions/equations for each board page

-- Create sketch_board_functions table
create table if not exists public.sketch_board_functions (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.sketch_boards(id) on delete cascade not null,
  page_id text not null, -- tldraw page ID
  function_id text not null, -- ID unic pentru funcție
  equation text not null, -- Ecuația matematică (LaTeX/MathML)
  color text not null default '#3b82f6', -- Culoare hex
  is_visible boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(board_id, page_id, function_id)
);

-- Create indexes for performance
create index if not exists idx_sketch_board_functions_board_id on public.sketch_board_functions(board_id);
create index if not exists idx_sketch_board_functions_board_page on public.sketch_board_functions(board_id, page_id);
create index if not exists idx_sketch_board_functions_function_id on public.sketch_board_functions(function_id);

-- Enable Row Level Security
alter table public.sketch_board_functions enable row level security;

-- RLS Policies for sketch_board_functions
-- Functions are readable if board is public
drop policy if exists "sketch_board_functions_select_public" on public.sketch_board_functions;
create policy "sketch_board_functions_select_public"
  on public.sketch_board_functions for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.is_public = true
    )
  );

-- Functions are readable by board owner
drop policy if exists "sketch_board_functions_select_own" on public.sketch_board_functions;
create policy "sketch_board_functions_select_own"
  on public.sketch_board_functions for select
  to authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

-- Anyone can insert/update functions for public boards
drop policy if exists "sketch_board_functions_insert_public" on public.sketch_board_functions;
create policy "sketch_board_functions_insert_public"
  on public.sketch_board_functions for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.is_public = true
    )
  );

drop policy if exists "sketch_board_functions_update_public" on public.sketch_board_functions;
create policy "sketch_board_functions_update_public"
  on public.sketch_board_functions for update
  to anon, authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.is_public = true
    )
  )
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.is_public = true
    )
  );

-- Owners can insert/update functions
drop policy if exists "sketch_board_functions_insert_own" on public.sketch_board_functions;
create policy "sketch_board_functions_insert_own"
  on public.sketch_board_functions for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

drop policy if exists "sketch_board_functions_update_own" on public.sketch_board_functions;
create policy "sketch_board_functions_update_own"
  on public.sketch_board_functions for update
  to authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

-- Anyone can delete functions for public boards
drop policy if exists "sketch_board_functions_delete_public" on public.sketch_board_functions;
create policy "sketch_board_functions_delete_public"
  on public.sketch_board_functions for delete
  to anon, authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.is_public = true
    )
  );

drop policy if exists "sketch_board_functions_delete_own" on public.sketch_board_functions;
create policy "sketch_board_functions_delete_own"
  on public.sketch_board_functions for delete
  to authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_functions.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

-- Trigger for updated_at timestamp
drop trigger if exists update_sketch_board_functions_updated_at on public.sketch_board_functions;
create trigger update_sketch_board_functions_updated_at
  before update on public.sketch_board_functions
  for each row
  execute function update_updated_at_column();

-- IMPORTANT: Enable Realtime for sketch_board_functions table
-- This allows real-time collaboration between users
-- Note: This command may fail if the table is already in the publication, which is fine
do $$
begin
  -- Add table to realtime publication if not already added
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'sketch_board_functions'
  ) then
    alter publication supabase_realtime add table sketch_board_functions;
  end if;
end $$;

