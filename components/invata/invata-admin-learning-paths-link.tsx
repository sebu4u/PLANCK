"use client"

import { useEffect, useState, type ComponentType } from "react"
import { useAdmin } from "@/hooks/use-admin"

type AdminLearningPathsButton = ComponentType

export function InvataAdminLearningPathsLink() {
  const { isAdmin, loading } = useAdmin()
  const [ButtonComponent, setButtonComponent] = useState<AdminLearningPathsButton | null>(null)

  useEffect(() => {
    if (loading || !isAdmin || ButtonComponent) return

    let cancelled = false
    void import("@/components/invata/invata-admin-learning-paths-button").then((mod) => {
      if (!cancelled) setButtonComponent(() => mod.InvataAdminLearningPathsButton)
    })

    return () => {
      cancelled = true
    }
  }, [ButtonComponent, isAdmin, loading])

  if (loading || !isAdmin) return null

  return ButtonComponent ? <ButtonComponent /> : null
}
