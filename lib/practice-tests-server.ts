import "server-only"

import type { SupabaseClient } from "@supabase/supabase-js"
import {
  catalogMathToPublicItem,
  catalogPhysicsToPublicItem,
  parsePracticeTestItems,
  toPublicCustomItem,
  type PracticeTestCatalogItem,
  type PracticeTestItem,
  type PracticeTestPublicItem,
} from "@/lib/practice-tests"

type CatalogPhysicsRow = {
  id: string
  title: string | null
  statement: string | null
  image_url: string | null
  answer_type: string | null
  grila_options: string[] | null
  value_subpoints: Array<{
    label?: string
    text_before?: string
    text_after?: string
    correct_value?: number
  }> | null
  grila_correct_index: number | null
}

type CatalogMathRow = {
  id: string
  title: string | null
  statement: string | null
  image_url: string | null
  answer_type: string | null
  value_subpoints: Array<{
    label?: string
    text_before?: string
    text_after?: string
    correct_value?: number
  }> | null
}

export async function resolvePracticeTestPublicItems(
  supabase: SupabaseClient,
  itemsRaw: unknown,
): Promise<PracticeTestPublicItem[]> {
  const items = parsePracticeTestItems(itemsRaw)
  return resolveParsedPublicItems(supabase, items)
}

export async function resolveParsedPublicItems(
  supabase: SupabaseClient,
  items: PracticeTestItem[],
): Promise<PracticeTestPublicItem[]> {
  const physicsIds = items
    .filter((i): i is PracticeTestCatalogItem => i.type === "catalog" && i.subject === "fizica")
    .map((i) => i.problemId)
  const mathIds = items
    .filter((i): i is PracticeTestCatalogItem => i.type === "catalog" && i.subject === "matematica")
    .map((i) => i.problemId)

  const physicsMap = new Map<string, CatalogPhysicsRow>()
  const mathMap = new Map<string, CatalogMathRow>()

  if (physicsIds.length > 0) {
    const { data } = await supabase
      .from("problems")
      .select("id, title, statement, image_url, answer_type, grila_options, value_subpoints, grila_correct_index")
      .in("id", physicsIds)
    for (const row of data ?? []) {
      physicsMap.set(row.id, row as CatalogPhysicsRow)
    }
  }

  if (mathIds.length > 0) {
    const { data } = await supabase
      .from("math_problems")
      .select("id, title, statement, image_url, answer_type, value_subpoints")
      .in("id", mathIds)
      .eq("is_active", true)
    for (const row of data ?? []) {
      mathMap.set(row.id, row as CatalogMathRow)
    }
  }

  const publicItems: PracticeTestPublicItem[] = []
  for (const item of items) {
    if (item.type === "custom") {
      publicItems.push(toPublicCustomItem(item))
      continue
    }
    if (item.subject === "fizica") {
      const problem = physicsMap.get(item.problemId)
      if (!problem) {
        publicItems.push({
          id: item.id,
          type: "catalog",
          answerType: "unknown",
          title: null,
          statement: "Problema din catalog nu a putut fi încărcată.",
          imageUrl: null,
          options: null,
          valueSubpoints: null,
          catalogSubject: item.subject,
          problemId: item.problemId,
        })
        continue
      }
      publicItems.push(catalogPhysicsToPublicItem(item, problem))
      continue
    }

    const problem = mathMap.get(item.problemId)
    if (!problem) {
      publicItems.push({
        id: item.id,
        type: "catalog",
        answerType: "unknown",
        title: null,
        statement: "Problema din catalog nu a putut fi încărcată.",
        imageUrl: null,
        options: null,
        valueSubpoints: null,
        catalogSubject: item.subject,
        problemId: item.problemId,
      })
      continue
    }
    publicItems.push(catalogMathToPublicItem(item, problem))
  }

  return publicItems
}

export { type CatalogPhysicsRow, type CatalogMathRow }
