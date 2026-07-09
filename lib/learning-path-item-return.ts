export const LEARNING_PATH_ITEM_RETURN_PARAM = "from"

export type LearningPathItemReturnSource = "dashboard" | "lesson"

type SearchParamSource = URLSearchParams | Record<string, string | string[] | undefined>

function readSearchParam(source: SearchParamSource, key: string): string | null {
  if (source instanceof URLSearchParams) {
    const value = source.get(key)
    return value?.trim() ? value.trim() : null
  }

  const raw = source[key]
  if (typeof raw === "string") return raw.trim() || null
  if (Array.isArray(raw)) return raw[0]?.trim() || null
  return null
}

export function parseLearningPathItemReturnSource(
  source: SearchParamSource | null | undefined,
): LearningPathItemReturnSource | null {
  if (!source) return null

  const value = readSearchParam(source, LEARNING_PATH_ITEM_RETURN_PARAM)
  if (value === "dashboard" || value === "lesson") return value
  return null
}

export function appendLearningPathItemReturnQuery(
  href: string,
  source: LearningPathItemReturnSource,
): string {
  const [pathAndQuery, hash = ""] = href.split("#")
  const [pathname, query = ""] = pathAndQuery.split("?")
  const params = new URLSearchParams(query)
  params.set(LEARNING_PATH_ITEM_RETURN_PARAM, source)
  const search = params.toString()
  return `${pathname}${search ? `?${search}` : ""}${hash ? `#${hash}` : ""}`
}

export function withDashboardItemReturn(href: string): string {
  return appendLearningPathItemReturnQuery(href, "dashboard")
}

export function withLessonItemReturn(href: string): string {
  return appendLearningPathItemReturnQuery(href, "lesson")
}

export function getLearningPathPaywallDismissHref(
  lessonBaseHref: string,
  returnSource: LearningPathItemReturnSource | null,
): string {
  if (returnSource === "dashboard") return "/dashboard"
  return lessonBaseHref
}

export function appendLearningPathItemReturnFromLocation(href: string): string {
  if (typeof window === "undefined") return href

  const source = parseLearningPathItemReturnSource(new URLSearchParams(window.location.search))
  if (!source) return href
  return appendLearningPathItemReturnQuery(href, source)
}

export function getLearningPathItemReturnSourceFromLocation(): LearningPathItemReturnSource | null {
  if (typeof window === "undefined") return null
  return parseLearningPathItemReturnSource(new URLSearchParams(window.location.search))
}
