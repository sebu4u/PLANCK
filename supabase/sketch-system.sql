-- Sketch Boards System Schema
-- Boards are permanent and don't require authentication

-- Create sketch_boards table
create table if not exists public.sketch_boards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null, -- Optional: creator if authenticated
  title text default 'Untitled Board',
  share_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  is_public boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Create sketch_board_pages table for storing page snapshots
create table if not exists public.sketch_board_pages (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references public.sketch_boards(id) on delete cascade not null,
  page_id text not null, -- tldraw page ID
  snapshot jsonb not null default '{}'::jsonb, -- tldraw store snapshot
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(board_id, page_id)
);

-- Create sketch_board_collaborators table (optional for future authenticated features)
create table if not exists public.sketch_board_collaborators (
  board_id uuid references public.sketch_boards(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamp with time zone default now(),
  primary key (board_id, user_id)
);

-- Create indexes for performance
create index if not exists idx_sketch_boards_share_token on public.sketch_boards(share_token);
create index if not exists idx_sketch_boards_user_id on public.sketch_boards(user_id);
create index if not exists idx_sketch_board_pages_board_id on public.sketch_board_pages(board_id);
create index if not exists idx_sketch_board_pages_board_page on public.sketch_board_pages(board_id, page_id);
create index if not exists idx_sketch_board_collaborators_board_id on public.sketch_board_collaborators(board_id);

-- Enable Row Level Security
alter table public.sketch_boards enable row level security;
alter table public.sketch_board_pages enable row level security;
alter table public.sketch_board_collaborators enable row level security;

-- RLS Policies for sketch_boards
-- Public boards are readable by anyone
drop policy if exists "sketch_boards_select_public" on public.sketch_boards;
create policy "sketch_boards_select_public"
  on public.sketch_boards for select
  to anon, authenticated
  using (is_public = true);

-- Authenticated users can see their own boards
drop policy if exists "sketch_boards_select_own" on public.sketch_boards;
create policy "sketch_boards_select_own"
  on public.sketch_boards for select
  to authenticated
  using (user_id = auth.uid());

-- Anyone can create boards (anonymous allowed)
drop policy if exists "sketch_boards_insert_anon" on public.sketch_boards;
create policy "sketch_boards_insert_anon"
  on public.sketch_boards for insert
  to anon, authenticated
  with check (true);

-- Anyone can update public boards
drop policy if exists "sketch_boards_update_public" on public.sketch_boards;
create policy "sketch_boards_update_public"
  on public.sketch_boards for update
  to anon, authenticated
  using (is_public = true)
  with check (is_public = true);

-- Owners can update their boards
drop policy if exists "sketch_boards_update_own" on public.sketch_boards;
create policy "sketch_boards_update_own"
  on public.sketch_boards for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Anyone can delete public boards (or owners can delete their own)
drop policy if exists "sketch_boards_delete_public" on public.sketch_boards;
create policy "sketch_boards_delete_public"
  on public.sketch_boards for delete
  to anon, authenticated
  using (is_public = true);

drop policy if exists "sketch_boards_delete_own" on public.sketch_boards;
create policy "sketch_boards_delete_own"
  on public.sketch_boards for delete
  to authenticated
  using (user_id = auth.uid());

-- RLS Policies for sketch_board_pages
-- Pages are readable if board is public
drop policy if exists "sketch_board_pages_select_public" on public.sketch_board_pages;
create policy "sketch_board_pages_select_public"
  on public.sketch_board_pages for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.is_public = true
    )
  );

-- Pages are readable by board owner
drop policy if exists "sketch_board_pages_select_own" on public.sketch_board_pages;
create policy "sketch_board_pages_select_own"
  on public.sketch_board_pages for select
  to authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

-- Anyone can insert/update pages for public boards
drop policy if exists "sketch_board_pages_insert_public" on public.sketch_board_pages;
create policy "sketch_board_pages_insert_public"
  on public.sketch_board_pages for insert
  to anon, authenticated
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.is_public = true
    )
  );

drop policy if exists "sketch_board_pages_update_public" on public.sketch_board_pages;
create policy "sketch_board_pages_update_public"
  on public.sketch_board_pages for update
  to anon, authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.is_public = true
    )
  )
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.is_public = true
    )
  );

-- Owners can insert/update pages
drop policy if exists "sketch_board_pages_insert_own" on public.sketch_board_pages;
create policy "sketch_board_pages_insert_own"
  on public.sketch_board_pages for insert
  to authenticated
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

drop policy if exists "sketch_board_pages_update_own" on public.sketch_board_pages;
create policy "sketch_board_pages_update_own"
  on public.sketch_board_pages for update
  to authenticated
  using (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.sketch_boards
      where sketch_boards.id = sketch_board_pages.board_id
      and sketch_boards.user_id = auth.uid()
    )
  );

-- RLS Policies for sketch_board_collaborators (for future authenticated features)
drop policy if exists "sketch_board_collaborators_select" on public.sketch_board_collaborators;
create policy "sketch_board_collaborators_select"
  on public.sketch_board_collaborators for select
  to authenticated
  using (user_id = auth.uid() or board_id in (
    select id from public.sketch_boards where user_id = auth.uid()
  ));

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- IMPORTANT: Enable Realtime for sketch_board_pages table
-- This allows real-time collaboration between users
-- Note: This command may fail if the table is already in the publication, which is fine
do $$
begin
  -- Add table to realtime publication if not already added
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and tablename = 'sketch_board_pages'
  ) then
    alter publication supabase_realtime add table sketch_board_pages;
  end if;
end $$;

-- Triggers for updated_at
drop trigger if exists update_sketch_boards_updated_at on public.sketch_boards;
create trigger update_sketch_boards_updated_at
  before update on public.sketch_boards
  for each row
  execute function update_updated_at_column();

drop trigger if exists update_sketch_board_pages_updated_at on public.sketch_board_pages;
create trigger update_sketch_board_pages_updated_at
  before update on public.sketch_board_pages
  for each row
  execute function update_updated_at_column();

