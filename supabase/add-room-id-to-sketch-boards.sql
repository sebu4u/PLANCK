-- Add room_id column to sketch_boards for PartyKit integration
-- This allows boards to be linked to PartyKit rooms for real-time collaboration

-- Add the room_id column
alter table public.sketch_boards 
add column if not exists room_id text;

-- Create index for faster lookups by room_id
create index if not exists idx_sketch_boards_room_id on public.sketch_boards(room_id);

-- Update existing boards without room_id to have one generated
-- This ensures backwards compatibility
update public.sketch_boards 
set room_id = encode(gen_random_bytes(8), 'hex')
where room_id is null;







