import type { Problem } from "@/data/problems"
import { BRAND_SUFFIX, truncateForPageTitle } from "@/lib/metadata"

const META_DESC_MAX = 158
const VISIBLE_EXCERPT_MAX = 420

/** Strip HTML tags, collapse whitespace, simplify inline LaTeX delimiters for plain-text SEO fields. */
export function stripMarkupForSeo(raw: string | null | undefined): string {
  if (!raw || typeof raw !== "string") return ""
  let s = raw.replace(/<[^>]+>/g, " ")
  s = s.replace(/\$\$[\s\S]*?\$\$/g, " ")
  s = s.replace(/\$[^$\n]+\$/g, " ")
  s = s.replace(/\\[a-zA-Z]+\{([^}]*)\}/g, "$1")
  s = s.replace(/\\[(),[\]]/g, " ")
  s = s.replace(/\s+/g, " ").trim()
  return s
}

export function truncateForMetaDescription(text: string, max = META_DESC_MAX): string {
  const t = text.trim()
  if (t.length <= max) return t
  const slice = t.slice(0, max - 1)
  const lastSpace = slice.lastIndexOf(" ")
  const cut = lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice
  return `${cut.trim()}…`
}

function joinDescriptionParts(problem: Problem): string {
  const parts = [
    stripMarkupForSeo(problem.title),
    stripMarkupForSeo(problem.description),
    stripMarkupForSeo(problem.statement),
  ].filter(Boolean)
  return parts.join(" — ")
}

export function buildProblemMetaDescription(problem: Problem): string {
  const joined = joinDescriptionParts(problem)
  if (!joined) {
    return `Problemă de fizică (${problem.category || "liceu"}) pe Planck Academy — explicații și antrenament pentru BAC.`
  }
  return truncateForMetaDescription(joined, META_DESC_MAX)
}

export function buildProblemPageTitle(problem: Problem): string {
  const title = stripMarkupForSeo(problem.title) || `Problemă ${problem.id}`
  return `${truncateForPageTitle(title)}${BRAND_SUFFIX}`
}

export function buildProblemKeywords(problem: Problem): string {
  let tagPart = ""
  if (Array.isArray(problem.tags)) {
    tagPart = problem.tags.map((t) => String(t).trim()).filter(Boolean).join(", ")
  } else if (typeof problem.tags === "string") {
    tagPart = problem.tags
      .split(/[,;]/)
      .map((t) => t.trim())
      .filter(Boolean)
      .join(", ")
  }
  const classLabel =
    typeof problem.class === "number" && Number.isFinite(problem.class)
      ? `fizică clasa a ${problem.class}-a`
      : typeof problem.classString === "string" && problem.classString.trim()
        ? problem.classString.trim()
        : ""
  const base =
    "probleme fizică, fizică liceu, BAC fizică, culegere fizică online, exerciții fizică, admitere fizică"
  const bits = [tagPart, problem.category, classLabel, base].filter(Boolean)
  return Array.from(new Set(bits.join(", ").split(", ").map((s) => s.trim()).filter(Boolean))).join(", ")
}

export function buildProblemPlainExcerpt(problem: Problem, maxLen = VISIBLE_EXCERPT_MAX): string {
  const fromStatement = stripMarkupForSeo(problem.statement)
  const fromDesc = stripMarkupForSeo(problem.description)
  const body = fromStatement || fromDesc || stripMarkupForSeo(problem.title)
  if (body.length <= maxLen) return body
  return `${body.slice(0, maxLen - 1).trim()}…`
}

export function problemEducationalLevel(problem: Problem): string | undefined {
  if (typeof problem.class === "number" && Number.isFinite(problem.class)) {
    return `Liceu, clasa a ${problem.class}-a`
  }
  if (problem.classString?.trim()) return problem.classString.trim()
  return undefined
}
