/**
 * Sanitizes generated content_json before storage to prevent stored XSS, while
 * preserving LaTeX math and code/identifier fields verbatim.
 *
 * Official PLANCK content is stored RAW (unescaped) — e.g. reveal_steps bodies
 * with `$$I_1 + I_2 = I_3 + I_4$$` and code_trace `while i <= 4:`. Pre-escaping
 * the whole string broke both: KaTeX received `f&#x27;(x)` (from `f'(x)`) and
 * failed to parse, rendering raw source; code lines showed `&lt;=` literally.
 *
 * This sanitizer is field- and math-aware:
 *  - HTML-rendered prose fields (body, content, text, instructions, prompt, a,
 *    b, description, headers) are HTML-escaped for XSS safety, but `$...$` and
 *    `$$...$$` math spans inside them are preserved verbatim so KaTeX sees the
 *    original LaTeX. Apostrophe (`'`) and `"` are NOT escaped: `'` is not an XSS
 *    vector in body context and escaping it broke KaTeX primes like `f'(x)`.
 *  - KaTeX / code / identifier fields (latexTemplate, chips, formula, svgPath,
 *    lines, options, answer, label, question, feedback, statement, ids, enums)
 *    are left RAW: they are rendered by KaTeX or as JSX text (auto-escaped) and
 *    must not be pre-escaped.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "/"]

const URL_KEYS = new Set([
  "url",
  "sourceUrl",
  "imageUrl",
  "imageSrc",
  "video_url",
  "youtube_url",
  "embedUrl",
])

/**
 * String fields that are rendered as JSX text (React-auto-escaped) or fed to
 * KaTeX. They must be stored verbatim — pre-escaping would double-encode them.
 */
const RAW_STRING_KEYS = new Set<string>([
  // KaTeX / math input
  "latexTemplate",
  "chips",
  "formula",
  "svgPath",
  // code rendered in <pre> as JSX text
  "lines",
  // LatexRichText-rendered (JSX auto-escaped, supports $...$ natively)
  "question",
  "label",
  "feedback",
  "statement",
  "answer",
  // JSX text labels
  "leftLabel",
  "rightLabel",
  "trueLabel",
  "falseLabel",
  // identifiers / enums / structural (not prose)
  "id",
  "kind",
  "side",
  "leftId",
  "rightId",
  "from",
  "to",
  "inputMode",
  "lineIndex",
  "correctIndex",
  "correctOptionId",
  "correctAnswerId",
  "mode",
  "secondsTotal",
  "targetMin",
  "targetMax",
  "min",
  "max",
  "step",
  "default",
  "language",
  "icon",
  "difficulty",
  "timeLimitSeconds",
  "aspectRatio",
  "imageSrc",
  "imageAlt",
  "imageUrl",
  "embedUrl",
])

function escapeText(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

function sanitizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ""
  try {
    const parsed = new URL(trimmed, "http://placeholder.invalid")
    if (ALLOWED_PROTOCOLS.includes(parsed.protocol) || trimmed.startsWith("/")) {
      return trimmed
    }
  } catch {
    return ""
  }
  return ""
}

/**
 * Escape `<`/`>`/`&` for XSS safety, but leave `$...$` and `$$...$$` math spans
 * untouched so KaTeX sees the original LaTeX. Nested `$` is not supported by the
 * renderer's own splitter either (it uses `[^$]+`), so the same restriction here
 * keeps behavior consistent.
 */
function sanitizeMathAwareString(value: string): string {
  const parts = value.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g)
  return parts
    .map((part) => {
      if (part.startsWith("$$") && part.endsWith("$$")) return part
      if (part.startsWith("$") && part.endsWith("$") && part.length > 1) return part
      return escapeText(part)
    })
    .join("")
}

function sanitizeValue(value: unknown, key: string | null): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string") {
    if (key && URL_KEYS.has(key)) return sanitizeUrl(value)
    if (key && RAW_STRING_KEYS.has(key)) return value
    return sanitizeMathAwareString(value)
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, key))
  if (typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [k, val] of Object.entries(value as Record<string, unknown>)) {
      result[k] = sanitizeValue(val, k)
    }
    return result
  }
  return value
}

export function sanitizeContentJson(content: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(content, null) as Record<string, unknown>
}
