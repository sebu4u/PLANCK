Run type checking on this repo and triage the results, following the "Validation" section in AGENTS.md.

In short:
1. Run `pnpm exec tsc --noEmit` via bash.
2. Ignore the known pre-existing backlog (`tsc_log*.txt`); focus on files touched in this change.
3. List touched-file errors first with `file:line` + message, then summarize the count of unrelated errors.
4. Propose minimal fixes consistent with AGENTS.md conventions.
5. If no touched-file errors, say so explicitly.

Do not edit `next-env.d.ts`, `tsconfig.tsbuildinfo`, or `tsconfig.json`.
