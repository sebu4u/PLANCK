---
name: planck-add-api-route
description: Scaffold a Next.js App Router API route handler in the PLANCK repo following its Supabase auth + error conventions. Use when adding a new API endpoint under app/api/.
---

# Add a PLANCK API route

Use this skill to scaffold a Next.js App Router route handler that follows PLANCK conventions. See AGENTS.md for the full project context.

## Location & files

- Create `app/api/<feature>/route.ts` (and `app/api/<feature>/[slug]/route.ts` if a path param is needed).
- Use `NextRequest` / `NextResponse` from `next/server`.

## Auth pattern (protected routes)

Mirror `app/api/admin/dev-users/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server"
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

Admin emails come from `ADMIN_EMAILS` env var or `role='admin'` in user metadata (see `lib/admin-check.ts`).

## Data access — pick the right Supabase client

| Need | Use | File |
|---|---|---|
| User session (cookies) on server | `createClient()` (async) | `@/lib/supabase/server` |
| Forwarded JWT | `createServerClientWithToken(accessToken)` | `@/lib/supabaseServer` |
| Cross-user/admin (bypasses RLS) | `getServiceRoleSupabase()` (server-only) | `@/lib/supabaseServiceRole` |

Never expose the service role key to the client. See the `planck-supabase` skill for details.

## Response & validation conventions

- Return JSON with `NextResponse.json(...)`. Status codes: 401 auth, 403 forbidden, 404 not found, 400 bad request, 200/201 success.
- Validate input with `zod` (already a dependency).
- Use `logger` from `@/lib/logger` for server-side logging, not raw `console.log`.
- Keep user-facing error messages in Romanian where they surface to the UI.

## After scaffolding

Run `/typecheck` (pi) or `pnpm exec tsc --noEmit` and confirm the new route is type-clean.
