---
name: planck-supabase
description: Supabase usage in the PLANCK Next.js codebase — choosing the right client (browser/server/JWT/service-role), writing SQL migrations with RLS policies, enabling realtime. Use when touching Supabase queries, auth, RLS, migrations, or realtime.
---

# PLANCK Supabase

This repo uses Supabase (Postgres + Auth + Realtime) with **four distinct client entry points**. Picking the wrong one is the most common source of auth/data bugs here.

## Choosing the right client

| Context | Use | File |
|---|---|---|
| Browser component / hook (user session in cookies) | `createClient()` from `@supabase/ssr` `createBrowserClient` | `@/lib/supabase/client` (preferred) or the legacy singleton `supabase` from `@/lib/supabaseClient` |
| Server Component / route handler reading the **user session** | `createClient()` (async, reads `next/headers` cookies) | `@/lib/supabase/server` |
| Route handler with a **forwarded JWT** (`authorization` header) | `createServerClientWithToken(accessToken)` | `@/lib/supabaseServer` |
| Admin / anonymous Insight usage — **bypasses RLS** | `getServiceRoleSupabase()` (`server-only`) | `@/lib/supabaseServiceRole` |

Critical rule: the **browser client must use `@supabase/ssr`'s `createBrowserClient`**, not plain `@supabase/supabase-js`. A plain client stores the session in `localStorage` only, so the server can't see it via cookies → `getUser()` returns null → protected routes bounce to `/`. This is documented in `lib/supabaseClient.ts`.

## Auth in API routes (admin pattern)

Mirror `app/api/admin/dev-users/route.ts`:

```ts
import { getAccessTokenFromRequest, isAdminFromDB } from "@/lib/admin-check"
import { isJwtExpired } from "@/lib/auth-validate"
import { createServerClientWithToken } from "@/lib/supabaseServer"

async function verifyAdmin(req: NextRequest) {
  const accessToken = getAccessTokenFromRequest(req.headers.get("authorization"))
  if (!accessToken) return { error: NextResponse.json({ error: "Necesită autentificare." }, { status: 401 }) }
  if (isJwtExpired(accessToken)) return { error: NextResponse.json({ error: "Sesiune expirată." }, { status: 401 }) }
  const supabaseUser = createServerClientWithToken(accessToken)
  const { data: { user }, error } = await supabaseUser.auth.getUser()
  if (error || !user) return { error: NextResponse.json({ error: "Sesiune invalidă." }, { status: 401 }) }
  if (!(await isAdminFromDB(supabaseUser, user))) return { error: NextResponse.json({ error: "Acces interzis." }, { status: 403 }) }
  return { userId: user.id }
}
```

Admin emails are configured via `ADMIN_EMAILS` env var or `role='admin'` in user metadata (see `lib/admin-check.ts`).

## Migrations & RLS

- Migrations live in `supabase/migrations/` (dated `YYYYMMDD_*.sql`) and loose feature SQL in `supabase/*.sql`.
- **Every new table must have RLS enabled** with explicit policies. Example style (from `supabase/rls-policies.sql`):

```sql
alter table if exists public.<table> enable row level security;

drop policy if exists "<table>_select_own" on public.<table>;
create policy "<table>_select_own"
  on public.<table> for select
  to authenticated
  using ((SELECT auth.uid()) = user_id);

drop policy if exists "<table>_insert_own" on public.<table>;
create policy "<table>_insert_own"
  on public.<table> for insert
  to authenticated
  with check ((SELECT auth.uid()) = user_id);
```

- Public-read tables use `to anon, authenticated` with `using (true)`.
- Always `drop policy if exists` before `create policy` so migrations are re-runnable.
- Reference examples: `supabase/rls-policies.sql`, `supabase/sketch-system.sql`, `supabase/insight-system.sql`, `supabase/coding-challenges.sql`, `supabase/badges-system.sql`.

## Realtime

To subscribe to a table from the client, the table must be in the `supabase_realtime` publication:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE <table>;
```

See `supabase/enable-realtime.sql`. Used by the sketch feature (`sketch_board_pages`).

## When to use service role

`getServiceRoleSupabase()` (`lib/supabaseServiceRole.ts`, `server-only`) **bypasses RLS**. Legitimate uses in this repo:
- Anonymous Insight AI usage tracking (`insight_*` tables) — see `lib/insight-usage-reserve.ts`, `lib/insight-limits.ts`.
- Admin operations that must cross user boundaries.

Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client. Never use the service role as a shortcut to avoid writing RLS policies.

## See also

- `AGENTS.md` — overall conventions.
- `lib/supabaseClient.ts` — detailed comment on why `@supabase/ssr` is required on the client.
- `supabase/rls-policies.sql`, `supabase/enable-realtime.sql` — canonical examples.
