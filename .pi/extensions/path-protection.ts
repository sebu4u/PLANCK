/**
 * Path Protection Extension
 *
 * Prevents the agent from leaking secrets (API keys, tokens, .env contents) into
 * the session transcript. Three layers:
 *
 * 1. Block `read`/`write`/`edit` of protected files (.env*, *.key, *.pem, …).
 *    The agent never needs to read env files — config comes from code, not env.
 * 2. Block `bash` commands that *print contents* of protected files (cat/sed/grep/rg
 *    … .env.local). Presence checks (test -f, ls, stat) and loaders (node --env-file)
 *    are allowed — they don't print file contents to the transcript.
 * 3. Redact secret-looking patterns from ANY tool's text output (the safety backstop).
 *    Catches leaks that slip through layer 2 (e.g. a command that prints a key via a
 *    variable expansion). Scrubs sk-*, sk-ant-*, JWTs (Supabase service role keys),
 *    and KEY=/TOKEN=/SECRET=/PASSWORD= assignments with long values.
 *
 * Install: drop into .pi/extensions/ (project-local, auto-discovered after /trust)
 * or ~/.pi/agent/extensions/ (global). Hot-reloadable via /reload.
 */

import type { ExtensionAPI, ToolResultEvent } from "@earendil-works/pi-coding-agent"

// --- Protected path detection ---------------------------------------------

const PROTECTED_BASENAMES = [".env"]
const PROTECTED_PREFIXES = [".env.", "secrets."]
const PROTECTED_SUFFIXES = [".key", ".pem", ".p12", ".pfx", ".secret"]

function basename(path: string): string {
  const norm = path.replace(/\\/g, "/")
  const slash = norm.lastIndexOf("/")
  return slash >= 0 ? norm.slice(slash + 1) : norm
}

function isProtectedPath(path: string): boolean {
  if (!path) return false
  const b = basename(path).toLowerCase()
  if (PROTECTED_BASENAMES.includes(b)) return true
  if (PROTECTED_PREFIXES.some((p) => b.startsWith(p))) return true
  if (PROTECTED_SUFFIXES.some((s) => b.endsWith(s))) return true
  return false
}

// Bash commands that print file *contents* to stdout (and thus the transcript).
const READ_VERBS =
  /\b(cat|tac|head|tail|sed|grep|rg|gsed|ggrep|awk|cut|less|more|nl|od|xxd|hexdump|base64|strings|bat|fd)\b/

// A protected path token as it might appear in a command string (with or without quotes/globs).
function commandMentionsProtectedPath(command: string): boolean {
  return /(^|[\s'"*])(\.env(\.[\w-]+)?|secrets\.[\w.-]+|[\w.-]+\.(key|pem|p12|pfx|secret))(\b|$|["'*])/i.test(
    command,
  )
}

// --- Secret-pattern redaction (output backstop) ---------------------------

function redactSecrets(text: string): { text: string; redacted: boolean } {
  if (!text) return { text, redacted: false }
  const before = text
  let out = text
  // Anthropic keys (most specific first).
  out = out.replace(/sk-ant-[A-Za-z0-9_-]{20,}/g, "<redacted>")
  // Generic OpenAI / DeepSeek / xAI / etc. keys.
  out = out.replace(/sk-[A-Za-z0-9_-]{20,}/g, "<redacted>")
  // JWTs — Supabase service role keys & access tokens are JWTs (eyJ...).
  out = out.replace(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g, "<redacted>")
  // KEY=/TOKEN=/SECRET=/PASSWORD= assignments with a long value.
  out = out.replace(
    /\b([A-Z][A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|SERVICE_ROLE_KEY|PASSWORD|PASS|KEY))\s*[:=]\s*["']?[A-Za-z0-9_\-./+=]{15,}/g,
    "$1=<redacted>",
  )
  return { text: out, redacted: out !== before }
}

export default function (pi: ExtensionAPI) {
  // Layer 1 + 2: block before execution.
  pi.on("tool_call", async (event) => {
    const tool = event.toolName

    // read / write / edit on protected paths.
    if (tool === "read" || tool === "write" || tool === "edit") {
      const path = (event.input?.path as string) ?? ""
      if (isProtectedPath(path)) {
        return {
          block: true,
          reason: `"${path}" is a protected file (secrets/env). Do not read or modify env/secret files directly — read config from code instead. To check whether a variable is set, use \`test -n "$VAR" && echo set || echo unset\`.`,
        }
      }
      return undefined
    }

    // bash that prints contents of protected files.
    if (tool === "bash") {
      const command = (event.input?.command as string) ?? ""
      if (READ_VERBS.test(command) && commandMentionsProtectedPath(command)) {
        return {
          block: true,
          reason:
            "This command would print the contents of a protected file (secrets/env) into the session. To check presence use `test -f <path>` or `ls <path>`; to check a variable use `test -n \"$VAR\" && echo set`. Reading env file contents is blocked to prevent leaking secrets.",
        }
      }
      return undefined
    }

    return undefined
  })

  // Layer 3: redact any secrets that still reach a tool's text output.
  pi.on("tool_result", async (event: ToolResultEvent, ctx) => {
    const content = event.content
    if (!Array.isArray(content) || content.length === 0) return undefined

    let anyRedacted = false
    const nextContent = content.map((block) => {
      if (block.type !== "text" || typeof block.text !== "string") return block
      const { text, redacted } = redactSecrets(block.text)
      if (redacted) {
        anyRedacted = true
        return { ...block, text }
      }
      return block
    })

    if (anyRedacted) {
      if (ctx.hasUI) {
        ctx.ui.notify("Path protection: redacted secrets from tool output.", "warning")
      }
      return { content: nextContent }
    }
    return undefined
  })
}
