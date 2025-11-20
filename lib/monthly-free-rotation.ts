import crypto from "crypto"
import type { SupabaseClient } from "@supabase/supabase-js"

export type MonthlyRotationSet = Set<string>

export const MONTHLY_FREE_PROBLEM_COUNT = 50

const MONTHLY_CACHE = new Map<string, Promise<MonthlyRotationSet>>()

const normalizeMonthKey = (sourceDate?: Date) => {
  const date = sourceDate ?? new Date()
  const month = `${date.getUTCMonth() + 1}`.padStart(2, "0")
  return `${date.getUTCFullYear()}-${month}`
}

const hashScore = (input: string) => {
  const hash = crypto.createHash("sha256").update(input).digest("hex")
  // Take first 12 hex chars -> convert to int -> normalize to 0-1
  const slice = hash.slice(0, 12)
  const value = parseInt(slice, 16)
  return value / 0xfffffffffffff
}

async function computeRotationSet(
  client: SupabaseClient,
  monthKey: string
): Promise<MonthlyRotationSet> {
  const { data, error } = await client
    .from("problems")
    .select("id")

  if (error) {
    console.error("[monthly-free-rotation] Failed to fetch ids:", error)
    return new Set()
  }

  const ranked = (data ?? [])
    .filter((item): item is { id: string } => typeof item?.id === "string")
    .map((item) => ({
      id: item.id,
      score: hashScore(`${monthKey}:${item.id}`),
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, MONTHLY_FREE_PROBLEM_COUNT)

  return new Set(ranked.map((item) => item.id))
}

export async function getMonthlyFreeProblemSet(
  client: SupabaseClient,
  monthKey = normalizeMonthKey()
): Promise<MonthlyRotationSet> {
  // Verifică mai întâi dacă există selecții manuale pentru această lună
  const { data: manualSelections, error: manualError } = await client
    .from("monthly_free_problems")
    .select("problem_id")
    .eq("month_key", monthKey)

  if (!manualError && manualSelections && manualSelections.length > 0) {
    // Dacă există selecții manuale, folosește-le
    // Invalidăm cache-ul pentru această lună pentru a forța reîncărcarea
    MONTHLY_CACHE.delete(monthKey)
    return new Set(manualSelections.map((item) => item.problem_id))
  }

  // Altfel, folosește algoritmul automat
  if (!MONTHLY_CACHE.has(monthKey)) {
    // purge old month cache to keep memory bounded
    if (MONTHLY_CACHE.size > 3) {
      MONTHLY_CACHE.clear()
    }
    MONTHLY_CACHE.set(monthKey, computeRotationSet(client, monthKey))
  }

  return MONTHLY_CACHE.get(monthKey)!
}

export async function isProblemFreeThisMonth(
  client: SupabaseClient,
  problemId: string,
  monthKey = normalizeMonthKey()
) {
  const set = await getMonthlyFreeProblemSet(client, monthKey)
  return set.has(problemId)
}

export function annotateProblemsWithMonthlyFlag<T extends { id: string }>(
  problems: T[],
  freeSet: MonthlyRotationSet
) {
  return problems.map((problem) => ({
    ...problem,
    isFreeMonthly: freeSet.has(problem.id),
  }))
}

export const currentMonthKey = () => normalizeMonthKey()

