"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useSubjectChangeCelebrationOptional } from "@/components/exerseaza/subject-change-celebration-provider"
import { supabase } from "@/lib/supabaseClient"
import {
  getPracticeSubjectRoute,
  type PracticeSubjectId,
} from "@/lib/practice-subject"

export function usePracticeSubjectSwitcher(
  currentSubject: PracticeSubjectId,
  options?: { navigateOnChange?: boolean },
) {
  const navigateOnChange = options?.navigateOnChange ?? true
  const router = useRouter()
  const { user, refreshProfile } = useAuth()
  const celebration = useSubjectChangeCelebrationOptional()
  const [isSaving, setIsSaving] = useState(false)

  const selectSubject = useCallback(
    async (next: PracticeSubjectId) => {
      if (next === currentSubject) return

      setIsSaving(true)
      try {
        let persisted = false

        if (user?.id) {
          const { error } = await supabase
            .from("profiles")
            .update({ preferred_materie: next })
            .eq("user_id", user.id)

          if (error) {
            console.error("[practice-subject-switcher] Failed to update preferred_materie:", error)
          } else {
            await refreshProfile()
            persisted = true
          }
        }

        if (persisted && celebration) {
          if (navigateOnChange) {
            celebration.queueSubjectChangeCelebrationForNavigation(currentSubject, next)
          } else {
            celebration.showSubjectChangeCelebration(currentSubject, next)
          }
        }

        if (navigateOnChange) {
          router.push(getPracticeSubjectRoute(next))
        }
      } finally {
        setIsSaving(false)
      }
    },
    [celebration, currentSubject, navigateOnChange, refreshProfile, router, user?.id],
  )

  return { selectSubject, isSaving }
}
