-- ID public pentru probleme de informatică (ex: I001), afișat în catalog ca la fizică (M100).

alter table if exists public.coding_problems
  add column if not exists display_id text;

create unique index if not exists idx_coding_problems_display_id_unique
  on public.coding_problems (display_id)
  where display_id is not null;

-- Backfill: I001, I002, … în ordinea created_at (apoi slug).
with numbered as (
  select
    id,
    'I' || lpad(row_number() over (order by created_at asc, slug asc)::text, 3, '0') as next_display_id
  from public.coding_problems
  where display_id is null
)
update public.coding_problems cp
set display_id = numbered.next_display_id
from numbered
where cp.id = numbered.id;
