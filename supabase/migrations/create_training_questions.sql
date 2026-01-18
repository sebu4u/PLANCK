-- Create table for training questions if it doesn't exist
create table if not exists public.training_questions (
    id uuid default gen_random_uuid() primary key,
    grade integer not null check (grade in (9, 10, 11, 12)),
    statement text not null,
    option1 text not null,
    option2 text not null,
    option3 text not null,
    option4 text not null,
    correct_option integer not null check (correct_option >= 1 and correct_option <= 4),
    problem_number integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies (optional, but good practice)
alter table public.training_questions enable row level security;

-- Allow read access to everyone
create policy "Allow public read access"
on public.training_questions
for select
to public
using (true);

-- Allow insert/update/delete only to authenticated users (or admins preferably, but simplified for now as per request)
-- Assuming authenticated users might need to add questions, or restricted to service_role in a real app.
-- For now allowing authenticated users to insert for ease of populating data
create policy "Allow authenticated insert"
on public.training_questions
for insert
to authenticated
with check (true);
