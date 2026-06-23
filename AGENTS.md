# PLANCK agent guide

Use this file as the first-pass context for future coding agents in this repo.
Keep changes focused, validate them, and prefer existing PLANCK patterns over new abstractions.

## Project basics

- Stack: Next.js 16 App Router (Turbopack for both dev and build), React 19, TypeScript strict, Tailwind/shadcn, pnpm, Supabase, OpenAI, Stripe, tldraw. `partysocket` is kept for board realtime (`lib/sketch/function-partykit-sync.ts`); the PartyKit server (`partykit/`, `partykit.json`) and the `partykit` npm package were removed — do not re-add them.
- User-facing text is Romanian. Match existing tone and visual density.
- Work from the repo root the user specified. Do not assume a fixed clone path.
- Do not print or commit secrets. `.env.local` is local only; public env vars are `NEXT_PUBLIC_*`.
- Do not commit `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next/`, `node_modules/`, agent session data, or throwaway plan/log files (`*.md` scratch notes, `tsc_log*.txt`).

## Sketch architecture

- The legacy `/sketch/[roomId]` PartyKit room route (`PlanckSketch.tsx`) was removed; all sketch boards now use `/sketch/board/[boardId]` (`components/sketch/TldrawEditor.tsx`, anon user flow via `/api/sketch/boards`).
- All navigations to a board must use the board's UUID `id`: `router.push(`/sketch/board/${board.id}`)`. The board's `room_id` field still exists in the DB (back-compat) but is **not** a URL segment anymore — do not reintroduce `/sketch/${room_id}` links.
- `/sketch/page.tsx` and `/sketch/new/page.tsx` redirect to `/sketch/boards` for both auth'd and guest users.
- `components/sketch/MathGraphPanel.tsx` and `lib/sketch/function-partykit-sync.ts` are the only consumers of `partysocket` now; do not delete the dep when removing dead code.

## Supabase rules

- Server components/routes needing the logged-in user should use `createClient()` from `@/lib/supabase/server`. Be aware that calling `cookies()` here makes the page **dynamic** — pages that only render public data should use the anon client (`createClient(url, anonKey)` from `@supabase/supabase-js`) so they can be ISR/static. See the ISR example below.
- Browser code should use `@/lib/supabase/client` or the existing legacy browser client only where already established.
- Privileged writes that must bypass RLS need `SUPABASE_SERVICE_ROLE_KEY` and must stay server-side.
- New/changed tables need migrations with RLS policies in the same migration.
- Adding a migration file does **not** apply it to the live Supabase project; say clearly when a SQL migration still needs to be run.

### Public ISR pages (anon client + `revalidate`)

For pages that only read public, user-independent data (e.g. `/concurs/rezultate`, `/cursuri/*`):

```ts
import { createClient } from "@supabase/supabase-js"

export const revalidate = 3600 // 1h ISR; pick a value appropriate to how often the data changes

async function getPublicData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  const { data } = await supabase.from("...").select("...").limit(...)
  return data ?? []
}
```

This is only safe when the table's RLS policy grants `anon` SELECT (e.g. `USING (true)` or a permissive public-read policy). Check the table's policies before switching a page from the cookie client to the anon client.

## `/invata` learning paths

- Premade and AI-generated courses share one backend: `learning_path_chapters`, `learning_path_lessons`, `learning_path_lesson_items`, and existing progress tables. AI chapters set `is_personalized=true`, `generated_by_user_id=<user>`, `is_active=false` while generating.
- Do **not** add separate personalized-course routes/tables unless the user explicitly asks; generated chapters render through `/invata/[chapterSlug]/[lessonSlug]/[itemIndex]`.
- Reuse real Planck content by reference when possible. Do not fabricate problems/quizzes/tests if existing DB content can cover the prompt.
- Lesson/course UI must look indistinguishable from existing `/invata`: `#f7f7f7` backgrounds, `#e6e6e6` borders, `#1f1f1f` buttons, 142x142 lesson cards, horizontal scroll, connection lines, no invented gradients.
- For generated learning paths, target multiple lessons and 20+ meaningful items per lesson unless the user asks for a smaller course.

### Personalized courses (AI-generated) — critical operational rules

Full how-to is in the `planck-personalized-courses` skill (load it before non-trivial work here). Key invariants any agent must know up front:

- **Detached generation only.** `POST /api/personalized-courses` inserts the chapter row (status `creating`, `is_active=false`) and returns `202` immediately; the heavy AI + DB work runs via Next.js `after()` (import from `next/server`). Never run the AI call in the synchronous handler — a client disconnect cancels it and nothing is saved. On success flip to `ready`+`is_active=true`; on error `failed` with the reason. Hard 5-min deadline in the planner.
- **Provider is OpenAI-compatible via env**, not hardcoded OpenAI. `DEEPSEEK_API_KEY` → `https://api.deepseek.com`, default model `deepseek-v4-flash`. Reasoning models (`deepseek-v4-pro`, `deepseek-reasoner`) truncate on a full plan (~20k reasoning tokens) — use the chat-class model. `response_format: { type: "json_object" }` is supported by chat-class only.
- **Generated item content is validated against the real parsers** (`validateInteractiveItemContent`, `validateTestContent`, plus `validatePollContent` in the planner). Invalid interactive content falls back to rich `custom_text` — never store a broken item. Generatable types match the official DB distribution (no `flow_build`/`graph_build`/`slider_explore`/`speed_round` — rare officially and error-prone).
- **`fill_slot` `latexTemplate` uses `{{id}}`/`{{{id}}}` placeholders ONLY** — never `?`, `\htmlId`, `\boxed`, `\text{?}`, `\color{#...}` (those are the renderer's *output*). `hasForbiddenFillSlotMarkers` rejects them; the count of `{{id}}` must equal the number of slots.
- **`sanitize.ts` is field- AND math-aware.** Escape `<>&` only in HTML-rendered prose fields (`body`, `content`, `text`, `instructions`, `prompt`, `a`, `b`, `description`, `headers`) while preserving `$...$`/`$$...$$` spans verbatim; leave KaTeX/code/JSX-text fields (`latexTemplate`, `chips`, `formula`, `lines`, `options`, `answer`, `label`, `question`, `statement`, …) **raw**. Official content is stored raw — never pre-escape `'` (breaks KaTeX primes `f'(x)`).
- **All math must be wrapped in `$...$`/`$$...$`.** Bare `x_0`, `f(x)=x^2` renders broken. The verifier auto-wraps single-letter `+_/^+alnum` tokens; the guide teaches the AI the format + official shortcodes (`[IMPORTANT]`/`[FORMULA]`/`[ENUNT]`/`[CODINLINE]`/`[DEFINITIE]`/`[EXEMPLU]`, supported by `LessonRichContent`).
- **Multiple-choice = exactly 4 options** (poll, test problems, `code_trace` choice, `reveal_steps` quiz). No answer leaks (correct option text must not appear in the question/statement/prompt/instructions).
- **Verifier pipeline** (`verifyGeneratedPlan`) runs after `normalizePlan`: hard checks (broken fill_slot, answer leak, ≠4 options, structural mismatches) replace the item with a `custom_text` connector; soft checks (bare math) flag only. The `VerificationReport` is stored in `generation_metadata.verification`.
- **Tolerant JSON parsing** (`parseJsonTolerant`): direct → trailing-comma repair → progressive truncation to recover a partial plan. Plus 1 retry with a repair note + higher `max_tokens`.
- **UI never navigates away during generation.** The optimistic in-progress card appears instantly at the top of the `/invata` chapter list via `PersonalizedCourseGenerationProvider` context; it polls `/api/personalized-courses/status` every 3s, the percent creeps continuously toward the next stage cap, and on `ready` it removes the optimistic entry and `router.refresh()` so the real card replaces it in place. Refresh survives because `/invata` fetches in-progress chapters (`is_active=false`) with the **admin client** (RLS blocks the user client from reading those rows).
- **Dev users** (`profiles.is_dev = true`, via `isDevFromDB`) bypass the Plus/Premium subscription gate and the 3/day + 20/total rate limits.

## Validation

- `next.config.mjs` ignores TypeScript build errors; always run `pnpm exec tsc --noEmit --pretty false` and inspect changed-file errors.
- Build with `pnpm exec next build` (Turbopack is the production bundler; there is no custom webpack config). The "middleware" filename is deprecated by Next 16 in favor of "proxy" — leaving the existing `middleware.ts` in place is fine, but a future migration can rename.
- `pnpm lint`/`next lint` may be stale under Next 16. If it fails on tooling/config rather than real issues, say so and don't block on it — but still investigate real lint errors it surfaces.
- Run `git diff --check` before committing.
- If `.next` contains stale generated route types after deleting routes, remove `.next` and re-run validation.
- Dev server may auto-increment from port 3000 to 3001; check `ss -tlnp | grep -E '300[0-9]'` if the browser does not load.

## Performance & CPU patterns

The PLANCK site had a CPU optimization pass (see `cpu-usage-optimization` branch). Future agents should preserve these patterns and not undo them.

### Middleware (server)

- `middleware.ts` calls `supabase.auth.getUser()` on every matched request, which is an external HTTP roundtrip per request. The matcher excludes API routes that authenticate via a forwarded JWT (`api/admin`, `api/insight`, `api/dev`, `api/coding-problems`, `api/stripe/checkout|sync|portal`, `api/run`, `api/run-interactive`, `api/mailerlite/webhook`) and public read-only routes (`api/search`, `api/physics`, etc.). `api/user/marketing-emails` is a **known exception** — it uses the cookie client (`@/lib/supabase/server`), whose `setAll` silently depends on middleware session refresh; do not add it to the exclusion list.

### Long-running API routes (server)

- Routes that do heavy work (OpenAI streaming, Judge0 batching, `after()`-detached generation, C++ execution) must declare `runtime` and `maxDuration`:
  ```ts
  export const runtime = "nodejs"
  export const maxDuration = 60 // or 300 for the personalized-courses planner
  ```
  Without `maxDuration`, Vercel may kill the function on a request timeout. Existing routes that have this: `insight/chat`, `invata/ask`, `coding-problems/[slug]/submit`, `personalized-courses`, `run-interactive`, `run`, `learning-path/flashcards/generate`, `cron/reengagement`.

### Caching (server)

- Public, user-independent API responses should set `Cache-Control: public, s-maxage=<ttl>, stale-while-revalidate=<double>` so Vercel's CDN can serve repeat requests. See `app/api/physics/grades/route.ts`, `app/api/physics/grades/[id]/route.ts`, `app/api/physics/chapters/[id]/route.ts`, `app/api/physics/lessons/[id]/route.ts`, `app/api/math-problems/route.ts` for examples.
- Do **not** cache user-specific or auth-dependent responses (any route that reads `cookies()` via `@/lib/supabase/server`).

### N+1 / waterfall patterns (server)

- Pages that loop `for..of await getX(id)` for every parent row should be converted to a single batch query with `.in("parent_id", ids)`. Examples that were fixed: `app/invata/page.tsx` (N lessons per chapter → `getLearningPathLessonsByChapterIds`), `app/cursuri/[slug]/page.tsx` (triple-nested chapters/lessons → `getChaptersByGradeIds` + `getLessonSummariesByChapterIds`).
- Admin/dev routes that paginate the full table with `fetchAllTableRows(...).select("*")` are intentional for now (admin UI reads `content_json` from the list response). Don't narrow columns without checking the admin editor's needs first.

### Animation loops (client)

- Any component using `requestAnimationFrame` for continuous rendering (orb, Prism, ColorBends) MUST pause when the container is off-screen (`IntersectionObserver`) and when `document.hidden` is true. The clock (`THREE.Clock`) should still tick outside the render branch so the first frame on resume doesn't jump.
- Heavy client-only libraries (`@tldraw/tldraw`, `@monaco-editor/react`, `three`, `gsap`) must be dynamically imported — never `import` them statically at the top of a component. Pattern: `const X = dynamic(() => import("..."), { ssr: false })`.

### Polling (client)

- Display-only timers (countdowns, "time left" labels) should gate their `setState` on `!document.hidden` so the browser doesn't re-render 1x/sec on a hidden tab. Example: `components/dashboard/contest-dashboard-promo.tsx`.
- Polling intervals that hit the server should be generous (5s+ for status checks, 30s+ for content refresh). The 1s `lib/sketch/realtime-sync.ts` polling fallback is the lower bound and is itself gated by a "is realtime healthy?" check that stops it as soon as realtime is confirmed.

### Bundle / build (client)

- Do not add these removed dependencies back without a strong reason: `expo`, `expo-asset`, `expo-file-system`, `expo-gl`, `react-native`, `pixi.js`, `postprocessing`, `@react-three/fiber`, `@stripe/stripe-js` (client), `tar-stream`, `csv-parse`, `dagre`, `recharts`, `mathjs` (replaced with `expr-eval`), `react-confetti`, `swr`, `partykit`, `react-force-graph-2d` (actually used by `components/space/knowledge-graph.tsx` — keep it).
- `gsap` and `@gsap/react` are still used by `components/scroll-animation-provider.tsx`, `components/SplitText.tsx`, and `components/magic-bento.tsx` (if re-introduced). Don't strip them from `package.json` without first checking those imports.
- `mathjs` was replaced with `expr-eval` (5KB vs 600KB). Use `Parser.parse(formula).evaluate(vals)` — **not** mathjs's `evaluate()`. `expr-eval` does not support implicit multiplication (`2x` must be `2*x`); if you add a new formula source, audit it.

## Opencode-specific notes

- When using `opencode` CLI, custom agent model configs in `opencode.json` are only loaded at startup. A new `model: "opencode-go/deepseek-v4-flash"` subagent won't take effect until the user quits and restarts opencode. If a user asks for a specific model in subagents and a restart is needed, say so explicitly rather than silently using the default `general` agent.

## Git hygiene

- Branch from `main`; keep commits focused and push to the requested branch.
- Before committing: inspect `git status --short`, `git diff --stat`, and the actual diff.
- Report exact validation commands/results and any migration/env steps still required.

## Skills & cross-agent context

- `.agents/skills/` holds Agent Skills packs (`planck-supabase`, `planck-learning-path`, `planck-add-api-route`, `planck-add-supabase-migration`, `planck-personalized-courses`); load the relevant one before non-trivial work in that area.
- `CLAUDE.md` is a symlink to this file, so Claude Code and pi/Codex/Cursor share one source of truth. Edit here only.
