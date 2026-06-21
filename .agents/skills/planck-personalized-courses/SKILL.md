---
name: planck-personalized-courses
description: The PLANCK personalized-course (AI-generated learning path) pipeline — detached generation on official learning-path tables, parser-validated rich content, math-aware sanitization, a verifier pipeline, tolerant JSON, and an in-place optimistic progress UI. Use when working on lib/personalized-courses/*, app/api/personalized-courses/*, the generator/progress-card components, or sanitize.ts.
---

# PLANCK personalized courses (AI-generated learning paths)

AI-generated courses are stored as official `learning_path_chapters`/`_lessons`/`_lesson_items` rows with `is_personalized=true`, `generated_by_user_id=<user>`. They render through the same `/invata/[chapterSlug]/[lessonSlug]/[itemIndex]` routes as official courses. Generation is **detached** so it survives client disconnects.

## Architecture map (request lifecycle)

1. **`POST /api/personalized-courses`** (`app/api/personalized-courses/route.ts`): auth + (dev bypass) + rate limit → insert chapter row (`generation_status="creating"`, `is_active=false`) → return `202` immediately with `{ chapterId, chapterSlug, title, description }`. **Never** run the AI call in the synchronous handler.
2. **`after(async () => { … })`** (import `after` from `next/server`, **not** `afterResponse`): the heavy work runs detached. Stages write `{ stage, percent, message }` to `generation_metadata.progress` so the UI can show real progress. On success: flip to `generation_status="ready"` + `is_active=true`. On error: `markChapterFailed` → `generation_status="failed"` + `reason` in metadata.
3. **`planPersonalizedCourse`** (`lib/personalized-courses/planner.ts`): `searchPlanckContentForPrompt` → build messages → call the model (retry loop, tolerant parse) → `normalizePlan` (coerce/validate each item) → `verifyGeneratedPlan` (second pass, replace broken items) → return `{ plan, verification }`.
4. **`searchPlanckContentForPrompt`** (`lib/personalized-courses/search.ts`): fetches real Planck candidates (learning_path_item, problem, quiz_question, math_problem, coding_problem) matching the prompt; returns `PersonalizedCourseCatalogCandidate[]` with `source_key`s.
5. **UI** (`app/invata/page.tsx` + `components/invata/`): the generator pushes an **optimistic** in-progress chapter into `PersonalizedCourseGenerationProvider` context → `LearningPathsList` prepends it → `PersonalizedCourseProgressCard` polls `/api/personalized-courses/status` every 3s → on `ready` removes the optimistic entry and `router.refresh()` so the real card replaces it in place.

## Provider config (OpenAI-compatible via env)

Resolved in `getPlannerProviderConfig()`:
- `DEEPSEEK_API_KEY` → `baseURL https://api.deepseek.com`, default model `deepseek-v4-flash`.
- `OPENAI_API_KEY` → OpenAI default `gpt-4o-mini`.
- Overrides: `PERSONALIZED_COURSE_API_KEY` (precedence), `PERSONALIZED_COURSE_BASE_URL`, `PERSONALIZED_COURSE_OPENAI_MODEL`.

**Gotchas:**
- **Reasoning models truncate on a full plan.** `deepseek-v4-pro`/`deepseek-reasoner` spend ~20k tokens on hidden reasoning → empty/truncated content even at `max_tokens=32000`, ~270s latency. Use the chat-class model (`deepseek-v4-flash`, ~60s, fits the budget).
- `response_format: { type: "json_object" }` is supported by chat-class models **only** — not `deepseek-reasoner`.
- DeepSeek's `json_object` mode requires the word "json" somewhere in the prompt or it 400s.
- `max_tokens`: 24000 (flash) / 32000 (reasoning models). Client `timeout` 180s. **Hard 5-min deadline** in `planPersonalizedCourse` across all attempts so a stuck generation flips to `failed` instead of hanging forever.

## Content generation rules

The AI may generate items for these types only (`GENERATABLE_ITEM_TYPES`), chosen to match the official DB distribution:
`custom_text, poll, match, card_sort, fill_slot, reveal_steps, table_fill, swipe_classify, memory_flip, code_trace, test`.

**Do NOT generate** `flow_build`, `graph_build`, `slider_explore`, `speed_round` — rare/absent officially and the most error-prone schemas (SVG paths, mathjs formulas, timed rounds).

- **Every generated item's `content_json` is validated against the real parsers** before storage: interactive types via `validateInteractiveItemContent` (`lib/learning-path-interactive-items.ts`), `test` via `validateTestContent` (`lib/learning-path-test.ts`, `minProblems: 2`), `poll` via `validatePollContent` (in the planner — mirrors `parsePollContent`). Invalid content falls back to a rich `custom_text` connector — **never store a broken item**.
- **`fill_slot` `latexTemplate` uses `{{id}}`/`{{{id}}}` placeholders ONLY.** Never `?`, `\htmlId`, `fill-slot-`, `\boxed`, `\text{?}`, `\color{#...}` — those are the renderer's *output* (`buildFillSlotLatex` turns `{{id}}` into `\htmlId{fill-slot-id}{\boxed{...}}`). `hasForbiddenFillSlotMarkers` rejects them; the count of `{{id}}` must equal the number of slots; chips must include every slot answer.
- **Multiple-choice = exactly 4 options** (poll, test problems, `code_trace` choice, `reveal_steps` quiz). No answer leaks: the correct option text must not appear in the question/statement/prompt/instructions.
- **Custom shortcodes** (processed by `components/lesson-rich-content.tsx`): `[IMPORTANT]`, `[FORMULA]`, `[ENUNT]`, `[CODINLINE]`, `[DEFINITIE]`, `[EXEMPLU]`, `[COD]`, `[INDENT]`. Teach the AI to use these for official-style rendering.
- The exact per-type `content_json` schemas and the `FORMAT MATEMATIC` rules live in `GENERATED_CONTENT_GUIDE` / `SYSTEM_PROMPT` inside `planner.ts` — edit there when changing what the AI can produce.

## Sanitization (`lib/personalized-courses/sanitize.ts`)

**Field- and math-aware.** Official content is stored raw; generated content must be sanitized for XSS without corrupting LaTeX/code.

- **Escape `<>&` only in HTML-rendered prose fields** (`body`, `content`, `text`, `instructions`, `prompt`, `a`, `b`, `description`, `headers`) — and within those, **preserve `$...$`/`$$...$$` spans verbatim** so KaTeX gets clean LaTeX.
- **Leave KaTeX/code/JSX-text fields raw** (`latexTemplate`, `chips`, `formula`, `svgPath`, `lines`, `options`, `answer`, `label`, `question`, `feedback`, `statement`, `leftLabel`/`rightLabel`, ids/enums) — they're rendered by KaTeX or React auto-escaped JSX, so pre-escaping double-encodes them.
- **Never escape `'` or `"`** — not XSS vectors in body context, and `'` breaks KaTeX primes (`f'(x)` → `f&#x27;(x)` → raw source dumped).
- URL fields (`url`, `imageUrl`, `embedUrl`, …) go through `sanitizeUrl`.

## Verifier pipeline (`verifyGeneratedPlan`)

Runs after `normalizePlan` as a second pass, catching quality issues that pass schema validation but still produce a broken experience:
- **Hard checks** (replace the item with a `custom_text` connector): fill_slot `?`/mismatched slots/answer-in-instructions, answer leak (correct option text in question/statement/prompt), ≠4 options, structural mismatches (match pairs, card_sort permutation, table_fill cells, memory_flip ≥2 pairs), `code_trace` `lineIndex` out of range.
- **Soft checks** (flag only, never replace — replacing would destroy the lesson): bare math outside `$...$` (`countBareMath`).
- **Auto-repair:** `applyBareMathWrap` wraps bare single-letter `+ _/^ + alnum` tokens (e.g. `L_0`, `x^2`) in `$...$` in `custom_text` bodies and `reveal_steps` markdown before checks run.
- The `VerificationReport` (`{ totalItems, replaced, byType, issues[], bareMathFlags, passed }`) is stored in `generation_metadata.verification`.

**Gotcha:** `countBareMath`'s regex middle class must be `[_^]` only — NOT `[_^a-zA-Z0-9]`, which matches every adjacent letter pair in prose ("es" in "este") and over-flags/replaces the whole lesson.

## Reliability

- **`parseJsonTolerant`**: direct parse → trailing-comma repair (`,\s*([}\])` → `$1`) → progressive truncation to recover a partial plan (2 of 3 lessons is better than none).
- **Retry loop** (2 attempts): on parse/validation failure, retry with a Romanian repair note ("return ONLY valid JSON, no fences, complete object") + `max_tokens + 8000` + lower temperature.
- `extractJsonObject` strips ```` ```json ```` fences and trims to the outermost `{ ... }`.

## UI invariants

- **Never navigate away during generation.** The user stays on `/invata`. The generator's `202` handler pushes an optimistic chapter into context and calls `router.refresh()` only for consistency — no `router.push`.
- **Optimistic card** (`PersonalizedCourseGenerationProvider` context): the generator and `LearningPathsList` share context; the list prepends optimistic chapters, deduped by id against server chapters so the optimistic entry drops once the real one arrives.
- **`PersonalizedCourseProgressCard`** polls `/api/personalized-courses/status` every 3s. On `ready` → `generation?.removeOptimisticChapter(id)` + `router.refresh()`. The **percent creeps continuously** toward the next stage cap (`creepCapForStage`: searching→14, planning→64, saving→96, finalizing→99, ready→100) so the bar always moves even during the long AI call; the server percent is the floor (jumps on stage change). The bar uses the `pc-progress-fill` shimmer class (`globals.css`). A cycling bottom message shows the server message first, then stage-specific elaborations (`STAGE_FALLBACK_MESSAGES`) every 2.6s.
- **Refresh survives** because `/invata` fetches in-progress chapters (`is_active=false`, `generation_status` creating/failed) via `getInProgressPersonalizedChapters` using the **admin client** — RLS blocks the user client from reading `is_active=false` rows even for the owner.
- `/invata/[chapterSlug]/page.tsx` is kept as a fallback (direct link/bookmark) but is not the primary flow.

## Access & rate limits

- `checkRateLimit` (`route.ts`): 3 courses/day, 20 total for regular users.
- **Dev users bypass both** the subscription gate and rate limits: detect with `isDevFromDB(supabase, user.id)` (`profiles.is_dev = true`) and skip.

## Validation checklist

This skill ships scripts in `scripts/` — use them instead of re-deriving the harness:

1. **`./scripts/validate-changed.sh [base]`** — runs `tsc --noEmit` and shows ONLY errors in files changed vs `base` (default `main`). Collapses the ~30 pre-existing unrelated errors into the 0-3 lines that matter. Exit 0 = clean.
2. **`pnpm exec next build --webpack`** — confirm the routes exist: `/api/personalized-courses`, `/api/personalized-courses/status`, `/invata/[chapterSlug]`.
3. **`./scripts/run-smoke.sh ["<prompt>"]`** — the decisive test: runs `planPersonalizedCourse` against a live model and asserts variety, no `fill_slot` `?`, `{{id}}` count === slots, exactly-4 options, 0 HTML entities in math spans, 0 poll answer leaks, verifier replaced < 25%. Exits non-zero on failure. It loads `.env.local` for the API key and uses the bundled `register.mjs`/`loader.mjs` to resolve `@/` aliases and stub `server-only`.
4. `git diff --check` before committing. Never commit `.env.local` or scratch `.mjs` files (the scripts in `scripts/` are committed — those are fine).

If you must run the planner by hand without the script, the loader pattern is: `node --experimental-strip-types --import <skill>/scripts/register.mjs --env-file=.env.local <your-test.mjs>`.

## Known gotchas

- `after` from `next/server`, not `afterResponse`.
- RLS blocks `is_active=false` reads for the user client — use the admin client (scoped to `generated_by_user_id`).
- DeepSeek `json_object` mode requires the word "json" in the prompt.
- `countBareMath` regex: `[_^]` only, never `[_^a-zA-Z0-9]`.
- Don't escape `'` in sanitization (breaks KaTeX primes).
- `fill_slot` `?` is always a placeholder mistake — the AI wrote `\frac{?}{?}` instead of `\frac{{{id}}}{{{id}}}`.
- Reasoning models (`-pro`/`-reasoner`/`o-series`) truncate on a full plan — use the chat-class model.
- Never run the AI generation in the synchronous request handler — a client disconnect cancels it and nothing is saved. Always insert the chapter first, return 202, then `after()`.

## See also

- `AGENTS.md` — overall conventions + the condensed operational rules.
- `lib/learning-path-interactive-items.ts` — the interactive content parsers (the source of truth for valid `content_json` shapes).
- `lib/learning-path-test.ts` — `validateTestContent` / `parseTestContent`.
- `components/lesson-rich-content.tsx` — the renderer (shortcodes, math splitting) that generated content must be compatible with.
- `lib/fill-slot-latex.ts` — `buildFillSlotLatex` (the `{{id}}` → `\htmlId` transform).
