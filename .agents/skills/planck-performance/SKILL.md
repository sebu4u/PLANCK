---
name: planck-performance
description: Performance & CPU patterns the PLANCK site enforces after a CPU optimization pass — middleware auth roundtrip, long-running API routes (`runtime`/`maxDuration`), CDN caching headers, N+1 batch queries, requestAnimationFrame pause behavior, dynamic imports for heavy client libs, polling intervals, and removed dependencies. Use when touching middleware, server loops, API route config, requestAnimationFrame, heavy client libraries, polling, or `package.json` deps. Don't undo these patterns.
---

# PLANCK performance & CPU patterns

The PLANCK site had a CPU optimization pass (see `cpu-usage-optimization` branch). Future agents must preserve these patterns and not undo them.

## Middleware

- `middleware.ts` calls `supabase.auth.getUser()` on every matched request — an external HTTP roundtrip per request.
- The `config.matcher` excludes routes that authenticate via forwarded JWT (so they don't need a cookie refresh) and public read-only routes. The exclusion list lives in `middleware.ts` itself.
- **`api/user/marketing-emails` is intentionally NOT excluded.** It uses the cookie client (`@/lib/supabase/server`) whose `setAll` depends on the middleware session refresh; removing it from the matcher breaks it. There is a code comment in `middleware.ts` flagging this.

## Long-running API routes

Routes that do heavy work (OpenAI streaming, Judge0 batching, `after()`-detached generation, C++ execution, personalized-course planning) must declare `runtime` and `maxDuration`, or Vercel kills the function on the default timeout:

```ts
export const runtime = "nodejs"
export const maxDuration = 60 // 300 for the personalized-courses planner
```

Existing routes with this: `app/api/insight/chat`, `app/api/invata/ask`, `app/api/coding-problems/[slug]/submit`, `app/api/personalized-courses`, `app/api/run-interactive`, `app/api/run`, `app/api/learning-path/flashcards/generate`, `app/api/cron/reengagement`. When adding a new long-running route, mirror them.

## Caching

- **Public, user-independent GETs**: set `Cache-Control: public, s-maxage=<ttl>, stale-while-revalidate=<double>` so Vercel's CDN can serve repeat requests. Examples: `app/api/physics/grades/route.ts`, `app/api/physics/grades/[id]/route.ts`, `app/api/physics/chapters/[id]/route.ts`, `app/api/physics/lessons/[id]/route.ts`, `app/api/math-problems/route.ts`.
- **Never cache user-specific or auth-dependent responses** (any route that reads `cookies()` via `@/lib/supabase/server`).

## N+1 / waterfall

- `for..of await getX(id)` loops → single batch query with `.in("parent_id", ids)`. Fixed: `app/invata/page.tsx` (→ `getLearningPathLessonsByChapterIds`), `app/cursuri/[slug]/page.tsx` (→ `getChaptersByGradeIds` + `getLessonSummariesByChapterIds`).
- Admin/dev `fetchAllTableRows(...).select("*")` is intentional for now (admin editor reads `content_json` from the list response) — don't narrow columns without checking the admin editor's needs first.

## Animation / heavy client

- `requestAnimationFrame` loops (orb, Prism, ColorBends) **must** pause when the container is off-screen (`IntersectionObserver`) and when `document.hidden`. The `THREE.Clock` should tick outside the render branch so the first frame on resume doesn't jump.
- Heavy client-only libraries (`@tldraw/tldraw`, `@monaco-editor/react`, `three`, `gsap`) **must** be dynamically imported — never `import` them statically at the top of a component:
  ```ts
  const X = dynamic(() => import("..."), { ssr: false })
  ```

## Polling

- Display-only timers (countdowns, "time left" labels) should gate their `setState` on `!document.hidden` so the browser doesn't re-render 1x/sec on a hidden tab. Example: `components/dashboard/contest-dashboard-promo.tsx`.
- Polling intervals that hit the server should be generous: 5s+ for status checks, 30s+ for content refresh. The 1s `lib/sketch/realtime-sync.ts` polling fallback is the lower bound and is itself gated by an "is realtime healthy?" check that stops it as soon as realtime is confirmed.

## Bundle / build

- `mathjs` was replaced with `expr-eval` (5KB vs 600KB). Use `Parser.parse(formula).evaluate(vals)` — not mathjs's `evaluate()`. **`expr-eval` does not support implicit multiplication** (`2x` must be `2*x`); audit any new formula source.
- Don't re-add removed dependencies without a strong reason: `expo`, `expo-asset`, `expo-file-system`, `expo-gl`, `react-native`, `pixi.js`, `postprocessing`, `@react-three/fiber`, `@stripe/stripe-js` (client), `tar-stream`, `csv-parse`, `dagre`, `recharts`, `mathjs`, `react-confetti`, `swr`, `partykit`. `react-force-graph-2d` is used by `components/space/knowledge-graph.tsx` — keep it. `gsap` and `@gsap/react` are used by `components/scroll-animation-provider.tsx`, `components/SplitText.tsx`, and `components/magic-bento.tsx` (if re-introduced) — don't strip without first checking those imports.
- If you think a removed dep should come back, check the `cpu-usage-optimization` branch first to understand why it was removed.

## See also

- `AGENTS.md` — overall conventions.
- `middleware.ts` — the matcher config and the `api/user/marketing-emails` exception comment.
- `lib/sketch/realtime-sync.ts` — the 1s polling fallback example.
