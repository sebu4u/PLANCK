-- Remember that the PLANCKPASS Season 1 intro was shown, once per account.
-- Apply this file in the Supabase SQL editor; adding it to the repo does not apply it to the live project.

alter table if exists public.profiles
  add column if not exists planckpass_intro_seen_at timestamptz;
