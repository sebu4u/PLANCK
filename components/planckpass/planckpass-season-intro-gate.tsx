"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/components/auth-provider"
import { useProductGuideBlocking } from "@/components/product-guide/product-guide-blocking"
import { PlanckPassSeasonIntro } from "@/components/planckpass/planckpass-season-intro"
import {
  hasLocalPlanckPassIntroSeen,
  isPlanckPassIntroPath,
  markLocalPlanckPassIntroSeen,
} from "@/lib/planckpass/intro"
import { supabase } from "@/lib/supabaseClient"

type PlanckPassIntroContextValue = {
  isOpen: boolean
  /** True while we still don't know if this account should see the intro. */
  isPending: boolean
}

const PlanckPassIntroContext = createContext<PlanckPassIntroContextValue>({
  isOpen: false,
  isPending: false,
})

export function usePlanckPassIntro() {
  return useContext(PlanckPassIntroContext)
}

export function PlanckPassSeasonIntroProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user, loading, profileSyncedUserId, needsOnboarding, isStudent } = useAuth()
  const { setBlocked } = useProductGuideBlocking()
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, setIsPending] = useState(false)

  useEffect(() => {
    if (loading || !user || profileSyncedUserId !== user.id) {
      setIsOpen(false)
      setIsPending(false)
      return
    }
    if (!isStudent || needsOnboarding || !isPlanckPassIntroPath(pathname)) {
      setIsOpen(false)
      setIsPending(false)
      return
    }
    if (hasLocalPlanckPassIntroSeen(user.id)) {
      setIsOpen(false)
      setIsPending(false)
      return
    }

    let cancelled = false
    setIsPending(true)

    const check = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("planckpass_intro_seen_at")
        .eq("user_id", user.id)
        .maybeSingle()

      if (cancelled) return

      if (data?.planckpass_intro_seen_at) {
        markLocalPlanckPassIntroSeen(user.id)
        setIsOpen(false)
        setIsPending(false)
        return
      }

      setIsOpen(true)
      setIsPending(false)
    }

    void check()
    return () => {
      cancelled = true
    }
  }, [isStudent, loading, needsOnboarding, pathname, profileSyncedUserId, user])

  useEffect(() => {
    setBlocked("planckpass-intro", isOpen)
    return () => setBlocked("planckpass-intro", false)
  }, [isOpen, setBlocked])

  const complete = useCallback(async () => {
    if (!user) {
      setIsOpen(false)
      return
    }

    markLocalPlanckPassIntroSeen(user.id)
    setIsOpen(false)
    setIsPending(false)

    const seenAt = new Date().toISOString()
    const { error } = await supabase
      .from("profiles")
      .update({ planckpass_intro_seen_at: seenAt })
      .eq("user_id", user.id)

    if (error) {
      console.warn("[planckpass-intro] failed to persist seen flag:", error.message)
    }
  }, [user])

  const value = useMemo(() => ({ isOpen, isPending }), [isOpen, isPending])

  return (
    <PlanckPassIntroContext.Provider value={value}>
      {children}
      {isOpen ? <PlanckPassSeasonIntro onComplete={() => void complete()} /> : null}
    </PlanckPassIntroContext.Provider>
  )
}
