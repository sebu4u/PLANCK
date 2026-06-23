Review the changed code against PLANCK conventions. Priority order:

1. Server/client boundary (browser-only APIs in server code; missing `"use client"`).
2. Supabase client choice — see AGENTS.md "Supabase — client choice" (browser / server-session / JWT / service-role).
3. RLS / security — new tables need RLS; service-role must not leak; protected routes use `verifyAdmin` (see `planck-add-api-route` skill).
4. Imports (`@/*` alias).
5. Env vars — added to `lib/env-validate.mjs`; secrets in `.env.local`; `NEXT_PUBLIC_*` prefix for public.
6. Types — keep correct manually; suggest running `pnpm exec tsc --noEmit --pretty false` after.

Also flag: inconsistent Romanian strings, leftover `console.log`, accidental edits to `next-env.d.ts` / `tsconfig.tsbuildinfo` / `pnpm-lock.yaml` / `.next/`.

Files in this change: {{files}}
