export interface FizicaMapItemContext {
  routeSlug: string
  chapterSlug: string
  fizicaLessonId: string
}

export const FIZICA_MAP_QUERY_FLAG = "fizica"
export const FIZICA_MAP_ROUTE_PARAM = "traseu"
export const FIZICA_MAP_CHAPTER_PARAM = "capitol"
export const FIZICA_MAP_LESSON_PARAM = "fizicaLesson"
export const FIZICA_MAP_COMPLETED_LESSON_PARAM = "lectieCompleta"

type SearchParamSource =
  | URLSearchParams
  | Record<string, string | string[] | undefined>

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

export function parseFizicaMapItemContext(source: SearchParamSource): FizicaMapItemContext | null {
  const flag = readSearchParam(source, FIZICA_MAP_QUERY_FLAG)
  if (flag !== "1") return null

  const routeSlug = readSearchParam(source, FIZICA_MAP_ROUTE_PARAM)
  const chapterSlug = readSearchParam(source, FIZICA_MAP_CHAPTER_PARAM)
  const fizicaLessonId = readSearchParam(source, FIZICA_MAP_LESSON_PARAM)

  if (!routeSlug || !chapterSlug || !fizicaLessonId) return null
  return { routeSlug, chapterSlug, fizicaLessonId }
}

export function buildFizicaMapItemQueryString(context: FizicaMapItemContext): string {
  const params = new URLSearchParams()
  params.set(FIZICA_MAP_QUERY_FLAG, "1")
  params.set(FIZICA_MAP_ROUTE_PARAM, context.routeSlug)
  params.set(FIZICA_MAP_CHAPTER_PARAM, context.chapterSlug)
  params.set(FIZICA_MAP_LESSON_PARAM, context.fizicaLessonId)
  return params.toString()
}

export function appendFizicaMapItemQuery(href: string, context: FizicaMapItemContext): string {
  const query = buildFizicaMapItemQueryString(context)
  const hashIndex = href.indexOf("#")
  const base = hashIndex >= 0 ? href.slice(0, hashIndex) : href
  const hash = hashIndex >= 0 ? href.slice(hashIndex) : ""
  const separator = base.includes("?") ? "&" : "?"
  return `${base}${separator}${query}${hash}`
}

export function getFizicaMapItemCacheSuffix(context: FizicaMapItemContext | null | undefined): string {
  if (!context) return ""
  return `?${buildFizicaMapItemQueryString(context)}`
}

export function buildFizicaMapReturnAfterLessonHref(
  routeSlug: string,
  chapterSlug: string,
  completedFizicaLessonId: string,
): string {
  const params = new URLSearchParams()
  params.set(FIZICA_MAP_ROUTE_PARAM, routeSlug)
  params.set(FIZICA_MAP_CHAPTER_PARAM, chapterSlug)
  params.set(FIZICA_MAP_COMPLETED_LESSON_PARAM, completedFizicaLessonId)
  return `/invata/fizica?${params.toString()}`
}
