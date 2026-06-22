---
name: planck-learning-path
description: The PLANCK learning-path / subject catalog system — the per-subject trio of learning-path config, catalog chapters, and Supabase queries. Use when adding a subject, chapter, lesson, or modifying the learning path catalog config.
---

# PLANCK learning-path & subject catalog

Subjects (matematică, fizică, informatică, biologie) each follow a **three-file pattern**. When adding or modifying a subject's learning path, keep the trio consistent.

## The trio

For a subject `<s>` (e.g. `matematica`, `fizica`, `informatica`, `biologia`):

1. **Learning-path config / marker** — `lib/learning-path-<s>.ts`
   - Exports a `<SUBJECT>_LEARNING_PATH_MARKER` string used in `learning_path_chapters.problem_category`.
   - Example: `lib/learning-path-matematica.ts` → `MATEMATICA_LEARNING_PATH_MARKER = "matematica"`.
   - See `lib/learning-path-informatica.ts`, `lib/learning-path-biologie.ts`, `lib/learning-path-fizica-config.ts`.

2. **Catalog chapters** — `lib/<s>-catalog-chapters.ts`
   - Canonical chapter list per class (9–12), used by both UI and dev validation.
   - Exports `<SUBJECT>_CLASS_VALUES` (e.g. `[9,10,11,12] as const`) and `<SUBJECT>_CATALOG_CHAPTER_OPTIONS: Record<ClassValue, string[]>`.
   - Example: `lib/informatica-catalog-chapters.ts`.

3. **Supabase queries** — `lib/supabase-<s>.ts` (and sometimes `lib/<s>-catalog-server.ts`)
   - Server-side fetch of chapters/problems/progress.
   - Examples: `lib/supabase-physics.ts`, `lib/supabase-fizica-calendar.ts`, `lib/supabase-fizica-learning-map.ts`, `lib/supabase-bac.ts`.

## Shared learning-path infrastructure

- `lib/learning-path-slug.ts` — slug helpers.
- `lib/learning-path-elo.ts` — ELO scoring for adaptive difficulty.
- `lib/learning-path-test.ts` — test battery logic.
- `lib/learning-path-chapter-theme.ts` — per-chapter theming.
- `lib/learning-path-flashcard-*.ts` — flashcard bridge/prompt/types.
- `lib/learning-path-interactive-items.ts` — interactive lesson items.
- `lib/learning-path-item-loader.ts` / `lib/learning-path-item-client-cache.ts` — item loading.
- `lib/learning-path-access.ts` / `lib/learning-path-free-plan.ts` — access control (subscription gating).
- `lib/learning-path-insight-context.ts` — Insight AI tutor context for a learning path item.
- `lib/supabase-learning-paths.ts` — generic learning-path queries (cross-subject).

## Adding a new subject

1. Add the marker in `lib/learning-path-<s>.ts`.
2. Add the catalog chapters in `lib/<s>-catalog-chapters.ts` (per class 9–12).
3. Add Supabase queries in `lib/supabase-<s>.ts`.
4. Add a SQL migration for any new tables/chapters under `supabase/` (RLS enabled — see the `planck-supabase` skill).
5. Wire up the route/UI under `app/<subject>/` and components as needed.
6. Register the subject wherever `problem_category` / subject markers are enumerated (grep for an existing marker like `MATEMATICA_LEARNING_PATH_MARKER` to find call sites).

## Adding a chapter to an existing subject

1. Append the chapter name to the right class array in `lib/<s>-catalog-chapters.ts`.
2. If it needs a DB row, add a migration inserting into the chapters table with the correct `problem_category` marker.
3. Update any subject-specific Supabase query / calendar map (`lib/supabase-<s>.ts`, `lib/supabase-fizica-calendar.ts`, etc.).

## Access & gating

Subscription tiers gate content via `lib/learning-path-access.ts`, `lib/learning-path-free-plan.ts`, `lib/coding-problems-access.ts`, `lib/access-config.ts`, and `lib/monthly-free-rotation.ts`. Check these before assuming new content is freely accessible.

## See also

- `AGENTS.md` — overall conventions.
- `lib/learning-path-matematica.ts`, `lib/learning-path-informatica.ts`, `lib/learning-path-biologie.ts`, `lib/learning-path-fizica-config.ts` — reference implementations.
- `supabase/migrations/20260222_create_learning_paths_tables.sql` — base schema.
