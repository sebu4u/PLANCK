"use client"

import { useCallback, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useSubjectChangeCelebrationOptional } from "@/components/exerseaza/subject-change-celebration-provider"
import { supabase } from "@/lib/supabaseClient"
import {
  getPracticeSubjectRoute,
  type PracticeSubjectId,
} from "@/lib/practice-subject"

export const PRACTICE_SUBJECT_CHANGE_EVENT = "planck:practice-subject"

function isExerseazaHubPath(pathname: string | null): boolean {
  return pathname === "/exerseaza" || Boolean(pathname?.startsWith("/exerseaza/"))
}

export function dispatchPracticeSubjectChange(next: PracticeSubjectId) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PRACTICE_SUBJECT_CHANGE_EVENT, { detail: next }))
}

export function usePracticeSubjectSwitcher(
  currentSubject: PracticeSubjectId,
  options?: {
    navigateOnChange?: boolean
    onSelected?: (next: PracticeSubjectId) => void
  },
) {
  const navigateOnChange = options?.navigateOnChange ?? true
  const onSelected = options?.onSelected
  const router = useRouter()
  const pathname = usePathname()
  const { user, refreshProfile } = useAuth()
  const celebration = useSubjectChangeCelebrationOptional()
  const [isSaving, setIsSaving] = useState(false)

  const selectSubject = useCallback(
    async (next: PracticeSubjectId) => {
      if (next === currentSubject) return

      onSelected?.(next)
      dispatchPracticeSubjectChange(next)
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

        const shouldNavigate = navigateOnChange && !isExerseazaHubPath(pathname)

        if (persisted && celebration) {
          if (shouldNavigate) {
            celebration.queueSubjectChangeCelebrationForNavigation(currentSubject, next)
          } else {
            celebration.showSubjectChangeCelebration(currentSubject, next)
          }
        }

        if (shouldNavigate) {
          router.push(getPracticeSubjectRoute(next))
        }
      } finally {
        setIsSaving(false)
      }
    },
    [
      celebration,
      currentSubject,
      navigateOnChange,
      onSelected,
      pathname,
      refreshProfile,
      router,
      user?.id,
    ],
  )

  return { selectSubject, isSaving }
}
