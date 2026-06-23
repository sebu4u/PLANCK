# PLANCK agent guide

Use this file as the first-pass context for future coding agents in this repo.
Keep changes focused, validate them, and prefer existing PLANCK patterns over new abstractions.

## Project basics

- Stack: Next.js 16 App Router (Turbopack), React 19, TypeScript strict, Tailwind/shadcn, pnpm, Supabase, OpenAI-compatible, Stripe, tldraw. `partysocket` is kept for board realtime; PartyKit server + npm package were removed — do not re-add them.
- User-facing text is Romanian. Match existing tone and density.
- Work from the repo root the user specified. Do not assume a fixed clone path.
- Do not print or commit secrets. `.env.local` is local only; public env vars are `NEXT_PUBLIC_*`.
- Do not commit `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next/`, `node_modules/`, agent session data, or scratch files (`*.md` notes, `tsc_log*.txt`).

## Sketch architecture

- Boards live at `/sketch/board/[boardId]` (anon flow via `/api/sketch/boards`). Board links use the UUID `id` — `room_id` is **not** a URL segment, never reintroduce `/sketch/${room_id}` links. `/sketch` and `/sketch/new` redirect to `/sketch/boards`. Only `components/sketch/MathGraphPanel.tsx` and `lib/sketch/function-partykit-sync.ts` use `partysocket`.

## Supabase — client choice (full guide: `planck-supabase` skill)

Picking the wrong client is the #1 auth/data bug here. Five entry points:

| Context | Use |
|---|---|
| Browser | `createClient()` from `@/lib/supabase/client` (uses `@supabase/ssr` `createBrowserClient`; plain `@supabase/supabase-js` stores in `localStorage` only → server `getUser()` returns null → bounce to `/`) |
| Server, user session (cookies) | `createClient()` from `@/lib/supabase/server` (async, reads `cookies()` → page is **dynamic**) |
| Server, public/ISR | `createClient(url, anonKey)` from `@supabase/supabase-js` + `export const revalidate` (safe only if RLS grants `anon` SELECT) |
| Route with forwarded JWT | `createServerClientWithToken(accessToken)` from `@/lib/supabaseServer` |
| Cross-user/admin (bypasses RLS) | `getServiceRoleSupabase()` from `@/lib/supabaseServiceRole` (server-only) |

- New tables need migrations with RLS in the same file. Adding a file does **not** apply it to the live project — say so.
- Privileged writes need `SUPABASE_SERVICE_ROLE_KEY` and must stay server-side.

## `/invata` (full guide: `planck-learning-path` skill)

Do **not** add separate personalized-course routes/tables unless the user explicitly asks; generated chapters render through `/invata/[chapterSlug]/[lessonSlug]/[itemIndex]`.

## Personalized courses (full guide: `planck-personalized-courses` skill)

Heavy work is detached (`after()` from `next/server`); the request returns `202` immediately. Dev users (`profiles.is_dev = true`) bypass the Plus/Premium gate and rate limits. Load the skill before any non-trivial work here.

## Validation

- `next.config.mjs` ignores TypeScript build errors; run `pnpm exec tsc --noEmit --pretty false` and inspect changed-file errors.
- Build with `pnpm exec next build` (Turbopack is the bundler; no custom webpack). Renaming `middleware.ts` → `proxy.ts` is a future Next 16 migration; leave as is for now.
- `pnpm lint` / `next lint` may be stale under Next 16. If it fails on tooling/config rather than real issues, say so and don't block — but investigate real lint errors.
- Run `git diff --check` before committing.
- If `.next` has stale generated route types after deleting routes, remove `.next` and re-run validation.
- Dev server may auto-increment 3000 → 3001; check `ss -tlnp | grep -E '300[0-9]'` if the browser does not load.

## Performance (full guide: `planck-performance` skill)

A CPU optimization pass (see `cpu-usage-optimization` branch) established patterns around middleware, server loops, API `runtime`/`maxDuration`, CDN caching, N+1, requestAnimationFrame, dynamic imports, polling, and removed deps. Load the `planck-performance` skill before touching any of those.

## Git hygiene

- Branch from `main`; keep commits focused and push to the requested branch.
- Before committing: inspect `git status --short`, `git diff --stat`, and the actual diff.
- Report exact validation commands/results and any migration/env steps still required.

## Skills & cross-agent context

- `.agents/skills/` packs: `planck-supabase`, `planck-learning-path`, `planck-add-api-route`, `planck-add-supabase-migration`, `planck-personalized-courses`, `planck-performance`. Load the relevant one before non-trivial work in that area.
- `CLAUDE.md` is a symlink to this file (one source of truth for pi/Codex/Cursor/Claude). Edit here only.
