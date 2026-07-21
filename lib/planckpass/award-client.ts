"use client"

import { supabase } from "@/lib/supabaseClient"
import { PLANCKPASS_XP } from "@/lib/planckpass/xp"

export const PLANCK_PASS_XP_UPDATED_EVENT = "planck:pass-xp-updated"
export const PLANCK_LESSON_XP_GAINED_EVENT = "planck:lesson-xp-gained"

export type PlanckLessonXpGainedDetail = {
  amount: number
  sourceKey: string
  source: string
}

export function notifyPlanckPassXpUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PLANCK_PASS_XP_UPDATED_EVENT))
}

/** Fired when a learning-path item grants (or should grant) lesson XP — drives in-lesson HUD. */
export function notifyLessonXpGained(detail: PlanckLessonXpGainedDetail) {
  if (typeof window === "undefined") return
  if (!detail.sourceKey || detail.amount <= 0) return
  window.dispatchEvent(
    new CustomEvent(PLANCK_LESSON_XP_GAINED_EVENT, { detail }),
  )
}

async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

/**
 * Idempotent XP grant via API (service-role path).
 * Avoids the broken SQL RPC until the ambiguous-column migration is applied.
 */
export async function awardPlanckPassXpSelf(input: {
  amount: number
  source: string
  sourceKey: string
  difficulty?: string | null
}): Promise<{ awarded: boolean; xpTotal: number; amount: number } | null> {
  if (!input.sourceKey || input.amount <= 0) return null

  const token = await getAccessToken()
  if (!token) {
    console.warn("planckpass xp: no session")
    return null
  }

  try {
    const res = await fetch("/api/planckpass/award", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        source: input.source,
        sourceKey: input.sourceKey,
        difficulty: input.difficulty ?? null,
      }),
    })

    const json = (await res.json().catch(() => null)) as {
      awarded?: boolean
      xp_total?: number
      amount?: number
      error?: string
    } | null

    if (!res.ok) {
      console.warn("planckpass xp:", json?.error || res.status, input)
      return null
    }

    if (json?.awarded) {
      notifyPlanckPassXpUpdated()
    }

    const amount = Number(json?.amount ?? 0) || input.amount

    return {
      awarded: Boolean(json?.awarded),
      xpTotal: Number(json?.xp_total ?? 0),
      amount,
    }
  } catch (err) {
    console.warn("planckpass xp:", err, input)
    return null
  }
}

/**
 * Award LP XP and always signal the lesson HUD (even if SQL already granted —
 * the API is idempotent and may return awarded:false).
 */
async function awardLpAndSignal(input: {
  amount: number
  source: "lp_item" | "lp_interactive" | "lp_test"
  sourceKey: string
}) {
  const result = await awardPlanckPassXpSelf(input)
  // Signal even when awarded:false (SQL may have granted first) so the lesson HUD animates.
  if (result) {
    notifyLessonXpGained({
      amount: result.amount > 0 ? result.amount : input.amount,
      sourceKey: input.sourceKey,
      source: input.source,
    })
  }
  return result
}

export async function awardPlanckPassXpForProblem(
  problemId: string,
  difficulty: string | null | undefined,
) {
  return awardPlanckPassXpSelf({
    amount: PLANCKPASS_XP.problemEasy, // server resolves real amount from difficulty
    source: "problem",
    sourceKey: String(problemId),
    difficulty,
  })
}

export async function awardPlanckPassXpForLpInteractive(itemId: string) {
  return awardLpAndSignal({
    amount: PLANCKPASS_XP.lpInteractive,
    source: "lp_interactive",
    sourceKey: itemId,
  })
}

export async function awardPlanckPassXpForLpItem(itemId: string) {
  return awardLpAndSignal({
    amount: PLANCKPASS_XP.lpItem,
    source: "lp_item",
    sourceKey: itemId,
  })
}

export async function awardPlanckPassXpForLpTest(itemId: string) {
  return awardLpAndSignal({
    amount: PLANCKPASS_XP.lpTest,
    source: "lp_test",
    sourceKey: itemId,
  })
}
