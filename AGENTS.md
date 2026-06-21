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

- Premade and AI-generated courses should use the same backend: `learning_path_chapters`, `learning_path_lessons`, `learning_path_lesson_items`, and existing progress tables.
- Do **not** add separate personalized-course routes/tables unless the user explicitly asks; generated chapters should render through `/invata/[chapterSlug]/[lessonSlug]/[itemIndex]`.
- User-scoped generated chapters should be private via RLS/metadata such as `generated_by_user_id`, while official chapters remain public.
- Reuse real Planck content by reference when possible. Do not fabricate problems/quizzes/tests if existing DB content can cover the prompt.
- Source-less AI connector/explanation items should be `custom_text`; avoid creating broken `text`, `video`, `grila`, `problem`, `math_problem`, or `coding_problem` items without valid source fields.
- Lesson/course UI must look indistinguishable from existing `/invata`: `#f7f7f7` backgrounds, `#e6e6e6` borders, `#1f1f1f` buttons, 142x142 lesson cards, horizontal scroll, connection lines, no invented gradients.
- For generated learning paths, target multiple lessons and 20+ meaningful items per lesson unless the user asks for a smaller course.

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

- `.agents/skills/` holds Agent Skills packs (`planck-supabase`, `planck-learning-path`, `planck-add-api-route`, `planck-add-supabase-migration`); load the relevant one before non-trivial work in that area.
- `CLAUDE.md` is a symlink to this file, so Claude Code and pi/Codex/Cursor share one source of truth. Edit here only.
