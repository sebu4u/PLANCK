// ESM resolve hook: maps `@/...` → repo root (cwd) and stubs `server-only` to an
// empty module, so the planner (which uses `@/` aliases + `import "server-only"`)
// can be executed directly under `node --experimental-strip-types` for smoke tests.
//
// Registered by register.mjs via `node --import ./register.mjs`.
import { pathToFileURL } from "node:url"
import { existsSync } from "node:fs"
import { join } from "node:path"

const REPO_ROOT = process.cwd()

export async function resolve(specifier, context, nextResolve) {
  // `server-only` is a Next.js-only guard; stub it so Node can run the module.
  if (specifier === "server-only") {
    return { url: "data:text/javascript;base64,", shortCircuit: true }
  }
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2)
    for (const ext of ["", ".ts", ".tsx", ".js", ".mjs"]) {
      const cand = join(REPO_ROOT, rel + ext)
      if (existsSync(cand)) return { url: pathToFileURL(cand).href, shortCircuit: true }
    }
  }
  return nextResolve(specifier, context)
}
