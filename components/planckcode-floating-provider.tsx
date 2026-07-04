"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { usePathname } from "next/navigation"
import type { FileItem } from "@/lib/types"
import { isPlanckIdeOriginRoute } from "@/lib/planckcode-shell-routes"
import { prefersReducedFloatingMotion } from "@/lib/planckcode-floating-animation"
import {
  buildFloatingSession,
  floatingSessionsEqual,
  readFloatingSessionFromStorage,
  writeFloatingSessionToStorage,
  writeIdeWorkspaceToStorage,
  workspacesEqual,
  type PlanckIdeFloatingSession,
  type PlanckIdeFloatingSource,
} from "@/lib/planckcode-floating-session"

export type PlanckIdeFloatingCardSize = "mini" | "expanded"

type RegisterSessionInput = {
  returnPath: string
  source: PlanckIdeFloatingSource
  problemSlug?: string
  defaultLanguage: "cpp" | "python"
  files: FileItem[]
  activeFileId: string
}

type PlanckIdeFloatingContextValue = {
  session: PlanckIdeFloatingSession | null
  isVisible: boolean
  entryAnimationActive: boolean
  cardSize: PlanckIdeFloatingCardSize
  registerLiveSession: (input: RegisterSessionInput) => void
  updateWorkspace: (files: FileItem[], activeFileId: string) => void
  setCardSize: (size: PlanckIdeFloatingCardSize) => void
  closeSession: () => void
  completeEntryAnimation: () => void
}

const PlanckIdeFloatingContext = createContext<PlanckIdeFloatingContextValue | null>(null)

export function PlanckIdeFloatingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [session, setSession] = useState<PlanckIdeFloatingSession | null>(null)
  const [isHydrated, setIsHydrated] = useState(false)
  const [cardSize, setCardSize] = useState<PlanckIdeFloatingCardSize>("mini")
  const [entryAnimationActive, setEntryAnimationActive] = useState(false)
  const wasOnOriginRouteRef = useRef(false)
  const hasHydratedRouteRef = useRef(false)

  useEffect(() => {
    setSession(readFloatingSessionFromStorage())
    setIsHydrated(true)
  }, [])

  const registerLiveSession = useCallback((input: RegisterSessionInput) => {
    setSession((current) => {
      if (current && floatingSessionsEqual(current, input)) {
        return current
      }

      const next = buildFloatingSession(input)
      writeFloatingSessionToStorage(next)
      writeIdeWorkspaceToStorage({ files: input.files, activeFileId: input.activeFileId })
      return next
    })
  }, [])

  const updateWorkspace = useCallback((files: FileItem[], activeFileId: string) => {
    setSession((current) => {
      if (!current) return current
      if (workspacesEqual(current, { files, activeFileId })) {
        return current
      }

      const next = buildFloatingSession({
        returnPath: current.returnPath,
        source: current.source,
        problemSlug: current.problemSlug,
        defaultLanguage: current.defaultLanguage,
        files,
        activeFileId,
      })
      writeFloatingSessionToStorage(next)
      writeIdeWorkspaceToStorage({ files, activeFileId })
      return next
    })
  }, [])

  const closeSession = useCallback(() => {
    setSession((current) => {
      if (!current) return current
      writeFloatingSessionToStorage(null)
      return null
    })
    setCardSize("mini")
    setEntryAnimationActive(false)
  }, [])

  const completeEntryAnimation = useCallback(() => {
    setEntryAnimationActive(false)
  }, [])

  const isOnOriginRoute = isPlanckIdeOriginRoute(pathname)
  const isVisible = isHydrated && Boolean(session) && !isOnOriginRoute

  useEffect(() => {
    if (!isHydrated) return

    const nowOnOrigin = isPlanckIdeOriginRoute(pathname)

    if (!hasHydratedRouteRef.current) {
      wasOnOriginRouteRef.current = nowOnOrigin
      hasHydratedRouteRef.current = true
      return
    }

    if (wasOnOriginRouteRef.current && !nowOnOrigin && session) {
      if (prefersReducedFloatingMotion()) {
        setEntryAnimationActive(false)
      } else {
        setEntryAnimationActive(true)
      }
      setCardSize("mini")
    }

    wasOnOriginRouteRef.current = nowOnOrigin
  }, [isHydrated, pathname, session])

  useEffect(() => {
    if (isOnOriginRoute) {
      setCardSize("mini")
      setEntryAnimationActive(false)
    }
  }, [isOnOriginRoute])

  const value = useMemo<PlanckIdeFloatingContextValue>(
    () => ({
      session,
      isVisible,
      entryAnimationActive,
      cardSize,
      registerLiveSession,
      updateWorkspace,
      setCardSize,
      closeSession,
      completeEntryAnimation,
    }),
    [
      session,
      isVisible,
      entryAnimationActive,
      cardSize,
      registerLiveSession,
      updateWorkspace,
      closeSession,
      completeEntryAnimation,
    ],
  )

  return (
    <PlanckIdeFloatingContext.Provider value={value}>{children}</PlanckIdeFloatingContext.Provider>
  )
}

export function usePlanckIdeFloating() {
  const context = useContext(PlanckIdeFloatingContext)
  if (!context) {
    throw new Error("usePlanckIdeFloating must be used within PlanckIdeFloatingProvider")
  }
  return context
}

export function usePlanckIdeFloatingOptional() {
  return useContext(PlanckIdeFloatingContext)
}
