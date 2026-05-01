import type { Problem } from "@/data/problems"
import { supabase } from "@/lib/supabaseClient"

/** Same key as legacy in-memory cache for the physics problems catalog list. */
export const PHYSICS_CATALOG_LIST_CACHE_KEY = "all-problems"

export const PHYSICS_CATALOG_CACHE_DURATION_MS = 5 * 60 * 1000

export const physicsCatalogClassMap: Record<number, string> = {
  9: "a 9-a",
  10: "a 10-a",
  11: "a 11-a",
  12: "a 12-a",
}

export const physicsCatalogProblemsCache = new Map<
  string,
  { data: Problem[]; timestamp: number }
>()

export function normalizePhysicsCatalogProblems(items: Problem[] = []): Problem[] {
  return items.map((problem: any) => ({
    ...problem,
    classString:
      physicsCatalogClassMap[problem.class as number] || problem.classString || "Toate",
  })) as Problem[]
}

export function getFreshPhysicsCatalogProblems(): Problem[] | null {
  const cached = physicsCatalogProblemsCache.get(PHYSICS_CATALOG_LIST_CACHE_KEY)
  if (cached && Date.now() - cached.timestamp < PHYSICS_CATALOG_CACHE_DURATION_MS) {
    return cached.data
  }
  return null
}

/**
 * Fetches the full physics problems list into the module cache (same source as the catalog).
 * Safe to call before client navigation so the catalog can hydrate without a loading skeleton.
 */
export async function ensurePhysicsCatalogProblemsCached(client = supabase): Promise<void> {
  const cached = physicsCatalogProblemsCache.get(PHYSICS_CATALOG_LIST_CACHE_KEY)
  if (cached && Date.now() - cached.timestamp < PHYSICS_CATALOG_CACHE_DURATION_MS) {
    return
  }

  const { data, error } = await client
    .from("problems")
    .select("*")
    .order("created_at", { ascending: false })

  if (error || !data) return

  const mapped = data.map((problem: any) => ({
    ...problem,
    classString: physicsCatalogClassMap[problem.class] || "Toate",
  })) as Problem[]

  physicsCatalogProblemsCache.set(PHYSICS_CATALOG_LIST_CACHE_KEY, {
    data: mapped,
    timestamp: Date.now(),
  })
}

const DEFAULT_PHYSICS_CATALOG_STORAGE_PREFIX = "catalog"
const CATALOG_SKIP_GRID_SKELETON_ONCE_STORAGE_SUFFIX = "catalogSkipGridSkeletonOnce"

/** Same shape as `getStorageKey(prefix, suffix)` used by the physics catalog client. */
export function getPhysicsCatalogSkipGridSkeletonSessionKey(
  prefix = DEFAULT_PHYSICS_CATALOG_STORAGE_PREFIX,
) {
  return `${prefix}:${CATALOG_SKIP_GRID_SKELETON_ONCE_STORAGE_SUFFIX}`
}
