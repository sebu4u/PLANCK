# PLANCK agent guide

Use this file as the first-pass context for future coding agents in this repo.
Keep changes focused, validate them, and prefer existing PLANCK patterns over new abstractions.

## Project basics

- Stack: Next.js 16 App Router, React 19, TypeScript strict, Tailwind/shadcn, pnpm, Supabase, OpenAI, Stripe, PartyKit.
- User-facing text is Romanian. Match existing tone and visual density.
- Work from the repo root the user specified. Do not assume a fixed clone path.
- Do not print or commit secrets. `.env.local` is local only; public env vars are `NEXT_PUBLIC_*`.
- Do not commit `next-env.d.ts`, `tsconfig.tsbuildinfo`, `.next/`, `node_modules/`, agent session data, or throwaway plan/log files (`*.md` scratch notes, `tsc_log*.txt`).

## Supabase rules

- Server components/routes needing the logged-in user should use `createClient()` from `@/lib/supabase/server`.
- Browser code should use `@/lib/supabase/client` or the existing legacy browser client only where already established.
- Privileged writes that must bypass RLS need `SUPABASE_SERVICE_ROLE_KEY` and must stay server-side.
- New/changed tables need migrations with RLS policies in the same migration.
- Adding a migration file does **not** apply it to the live Supabase project; say clearly when a SQL migration still needs to be run.

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
- Build with `pnpm exec next build --webpack`; dev uses Turbopack and can differ.
- `pnpm lint`/`next lint` may be stale under Next 16. If it fails on tooling/config rather than real issues, say so and don't block on it — but still investigate real lint errors it surfaces.
- Run `git diff --check` before committing.
- If `.next` contains stale generated route types after deleting routes, remove `.next` and re-run validation.
- Dev server may auto-increment from port 3000 to 3001; check `ss -tlnp | grep -E '300[0-9]'` if the browser does not load.

## Git hygiene

- Branch from `main`; keep commits focused and push to the requested branch.
- Before committing: inspect `git status --short`, `git diff --stat`, and the actual diff.
- Report exact validation commands/results and any migration/env steps still required.

## Skills & cross-agent context

- `.agents/skills/` holds Agent Skills packs (`planck-supabase`, `planck-learning-path`, `planck-add-api-route`, `planck-add-supabase-migration`, `planck-personalized-courses`); load the relevant one before non-trivial work in that area.
- `CLAUDE.md` is a symlink to this file, so Claude Code and pi/Codex/Cursor share one source of truth. Edit here only.
