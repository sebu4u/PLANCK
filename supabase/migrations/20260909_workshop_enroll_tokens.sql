-- Workshop opaque enrollment tokens for one-click email enrollment without CRON_SECRET
-- Allows ops to generate tokens directly from DB for MailerLite campaigns

create table if not exists public.workshop_enroll_tokens (
  token text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  workshop_id uuid not null references public.workshops(id) on delete cascade,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  expires_at timestamptz not null default (now() + interval '7 days')
);

create index if not exists workshop_enroll_tokens_user_id_idx
  on public.workshop_enroll_tokens (user_id);

create index if not exists workshop_enroll_tokens_workshop_id_idx
  on public.workshop_enroll_tokens (workshop_id);

create index if not exists workshop_enroll_tokens_expires_at_idx
  on public.workshop_enroll_tokens (expires_at);

alter table public.workshop_enroll_tokens enable row level security;

-- Service role only (ops + API route with service role client)
drop policy if exists "workshop_enroll_tokens_service_role_only" on public.workshop_enroll_tokens;
create policy "workshop_enroll_tokens_service_role_only"
  on public.workshop_enroll_tokens
  for all
  to service_role
  using (true)
  with check (true);

comment on table public.workshop_enroll_tokens is 
  'Opaque enrollment tokens for one-click workshop enrollment from marketing emails. Alternative to HMAC tokens when CRON_SECRET is not available locally.';
comment on column public.workshop_enroll_tokens.token is 
  'Random token (UUID or 32+ char hex). Use gen_random_uuid()::text or encode(gen_random_bytes(32), ''hex'').';
comment on column public.workshop_enroll_tokens.used_at is 
  'When the token was first used for enrollment. Idempotent: can be used multiple times.';
comment on column public.workshop_enroll_tokens.expires_at is 
  'Token expiration (default 7 days from creation). Expired tokens cannot be used.';
