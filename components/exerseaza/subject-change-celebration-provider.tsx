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
import { SubjectChangeCelebrationOverlay } from "@/components/exerseaza/subject-change-celebration-overlay"
import {
  readSubjectChangeCelebrationFromStorage,
  SUBJECT_CHANGE_CELEBRATION_COMPLETE_EVENT,
  writeSubjectChangeCelebrationToStorage,
  type SubjectChangeCelebrationCompleteDetail,
  type SubjectChangeCelebrationPayload,
} from "@/lib/subject-change-celebration"
import { isPracticeSubjectId, type PracticeSubjectId } from "@/lib/practice-subject"

type SubjectChangeCelebrationState = {
  from: PracticeSubjectId
  to: PracticeSubjectId
} | null

type SubjectChangeCelebrationContextValue = {
  showSubjectChangeCelebration: (from: PracticeSubjectId, to: PracticeSubjectId) => void
  queueSubjectChangeCelebrationForNavigation: (from: PracticeSubjectId, to: PracticeSubjectId) => void
}

const SubjectChangeCelebrationContext = createContext<SubjectChangeCelebrationContextValue | null>(
  null,
)

function parseCelebrationPayload(payload: SubjectChangeCelebrationPayload): SubjectChangeCelebrationState | null {
  if (!isPracticeSubjectId(payload.from) || !isPracticeSubjectId(payload.to)) return null
  return { from: payload.from, to: payload.to }
}

export function SubjectChangeCelebrationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [celebration, setCelebration] = useState<SubjectChangeCelebrationState>(null)

  const showSubjectChangeCelebration = useCallback((from: PracticeSubjectId, to: PracticeSubjectId) => {
    setCelebration({ from, to })
  }, [])

  const queueSubjectChangeCelebrationForNavigation = useCallback(
    (from: PracticeSubjectId, to: PracticeSubjectId) => {
      writeSubjectChangeCelebrationToStorage({ from, to })
    },
    [],
  )

  useEffect(() => {
    const pending = readSubjectChangeCelebrationFromStorage()
    if (!pending) return
    const parsed = parseCelebrationPayload(pending)
    if (parsed) setCelebration(parsed)
  }, [pathname])

  const value = useMemo(
    () => ({ showSubjectChangeCelebration, queueSubjectChangeCelebrationForNavigation }),
    [queueSubjectChangeCelebrationForNavigation, showSubjectChangeCelebration],
  )

  const handleCelebrationComplete = useCallback(() => {
    setCelebration((current) => {
      if (current) {
        window.dispatchEvent(
          new CustomEvent<SubjectChangeCelebrationCompleteDetail>(
            SUBJECT_CHANGE_CELEBRATION_COMPLETE_EVENT,
            { detail: { from: current.from, to: current.to } },
          ),
        )
      }
      return null
    })
  }, [])

  return (
    <SubjectChangeCelebrationContext.Provider value={value}>
      {children}
      {celebration ? (
        <SubjectChangeCelebrationOverlay
          from={celebration.from}
          to={celebration.to}
          onComplete={handleCelebrationComplete}
        />
      ) : null}
    </SubjectChangeCelebrationContext.Provider>
  )
}

export function useSubjectChangeCelebration() {
  const context = useContext(SubjectChangeCelebrationContext)
  if (!context) {
    throw new Error("useSubjectChangeCelebration must be used within SubjectChangeCelebrationProvider")
  }
  return context
}

export function useSubjectChangeCelebrationOptional() {
  return useContext(SubjectChangeCelebrationContext)
}
