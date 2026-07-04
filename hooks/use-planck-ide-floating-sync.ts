"use client"

import { useEffect } from "react"
import type { FileItem } from "@/lib/types"
import { usePlanckIdeFloatingOptional } from "@/components/planckcode-floating-provider"
import type { PlanckIdeFloatingSource } from "@/lib/planckcode-floating-session"

type UsePlanckIdeFloatingSyncOptions = {
  returnPath: string
  source: PlanckIdeFloatingSource
  problemSlug?: string
  defaultLanguage: "cpp" | "python"
  files: FileItem[]
  activeFileId: string
  enabled?: boolean
}

export function usePlanckIdeFloatingSync({
  returnPath,
  source,
  problemSlug,
  defaultLanguage,
  files,
  activeFileId,
  enabled = true,
}: UsePlanckIdeFloatingSyncOptions) {
  const floating = usePlanckIdeFloatingOptional()
  const registerLiveSession = floating?.registerLiveSession

  useEffect(() => {
    if (!registerLiveSession || !enabled) return
    registerLiveSession({
      returnPath,
      source,
      problemSlug,
      defaultLanguage,
      files,
      activeFileId,
    })
  }, [
    registerLiveSession,
    enabled,
    returnPath,
    source,
    problemSlug,
    defaultLanguage,
    files,
    activeFileId,
  ])
}
