/**
 * Sanitizes generated content_json before storage to prevent stored XSS.
 * Escapes HTML in string fields that will be rendered via LessonRichContent
 * (which uses dangerouslySetInnerHTML).
 *
 * This does NOT escape markdown syntax (**bold**, *italic*, [links](url), $math$)
 * — only raw HTML tags and dangerous protocols.
 */

const ALLOWED_PROTOCOLS = ["http:", "https:", "mailto:", "/"]

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
}

function sanitizeString(value: string): string {
  // Escape raw HTML tags so they render as text, not as HTML.
  // This prevents <script>, <img onerror>, etc. from being injected.
  // Markdown formatting (**bold**, *italic*, [text](url), $math$) is preserved
  // because LessonRichContent processes those via regex, not via HTML parsing.
  return escapeHtml(value)
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
    // Not a valid URL — return empty to be safe
    return ""
  }
  return ""
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === "string") return sanitizeString(value)
  if (Array.isArray(value)) return value.map(sanitizeValue)
  if (typeof value === "object") {
    const result: Record<string, unknown> = {}
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      // Special handling for URL-like fields
      if (
        (key === "url" || key === "sourceUrl" || key === "imageUrl" || key === "imageSrc" || key === "video_url" || key === "youtube_url") &&
        typeof val === "string"
      ) {
        result[key] = sanitizeUrl(val)
      } else {
        result[key] = sanitizeValue(val)
      }
    }
    return result
  }
  return value
}

export function sanitizeContentJson(content: Record<string, unknown>): Record<string, unknown> {
  return sanitizeValue(content) as Record<string, unknown>
}
