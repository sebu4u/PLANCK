Review the changed code following the "Code review checklist" in AGENTS.md. Priority order:

1. Server/client boundary (browser-only APIs in server code; missing `"use client"`).
2. Supabase client choice (browser / server-session / JWT / service-role).
3. RLS / security (new tables need RLS; service-role must not leak; protected routes use `verifyAdmin`).
4. Imports (`@/*` alias).
5. Env vars (added to `lib/env-validate.mjs`; secrets in `.env.local`; `NEXT_PUBLIC_*` prefix).
6. Types — keep correct manually; suggest running `/typecheck` after.

Also flag: inconsistent Romanian strings, leftover `console.log`, accidental edits to `next-env.d.ts` / `tsconfig.tsbuildinfo` / `pnpm-lock.yaml` / `.next/`.

Files in this change: {{files}}
