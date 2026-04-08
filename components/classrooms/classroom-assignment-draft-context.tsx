"use client"

import { usePathname } from "next/navigation"
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

export interface AssignmentDraftValues {
  title: string
  description: string
  deadline: string
}

interface StartPickingInput {
  classroomId: string
  draft: AssignmentDraftValues
}

interface ClassroomAssignmentDraftContextValue {
  mode: "idle" | "picking"
  classroomId: string | null
  draft: AssignmentDraftValues
  selectedProblemIds: string[]
  selectedProblemIdSet: Set<string>
  selectedCount: number
  isPickingForClassroom: (classroomId: string | null) => boolean
  startPicking: (input: StartPickingInput) => void
  cancelPicking: () => void
  isProblemSelected: (problemId: string) => boolean
  toggleProblem: (problemId: string) => void
  addProblem: (problemId: string) => void
  removeProblem: (problemId: string) => void
}

const emptyDraft: AssignmentDraftValues = {
  title: "",
  description: "",
  deadline: "",
}

const STORAGE_KEY = "planck-classroom-assignment-draft"

const ClassroomAssignmentDraftContext = createContext<ClassroomAssignmentDraftContextValue | null>(null)

function sameDraft(left: AssignmentDraftValues, right: AssignmentDraftValues) {
  return left.title === right.title && left.description === right.description && left.deadline === right.deadline
}

export function ClassroomAssignmentDraftProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [mode, setMode] = useState<"idle" | "picking">("idle")
  const [classroomId, setClassroomId] = useState<string | null>(null)
  const [draft, setDraft] = useState<AssignmentDraftValues>(emptyDraft)
  const [selectedProblemIds, setSelectedProblemIds] = useState<string[]>([])
  const historyEntryActiveRef = useRef(false)

  const reset = useCallback(() => {
    setMode("idle")
    setClassroomId(null)
    setDraft(emptyDraft)
    setSelectedProblemIds([])
    historyEntryActiveRef.current = false
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore storage errors
    }
  }, [])

  useEffect(() => {
    try {
      const rawValue = sessionStorage.getItem(STORAGE_KEY)
      if (!rawValue) return

      const parsed = JSON.parse(rawValue) as {
        mode?: "idle" | "picking"
        classroomId?: string | null
        draft?: AssignmentDraftValues
        selectedProblemIds?: string[]
      }

      setMode(parsed.mode === "picking" ? "picking" : "idle")
      setClassroomId(typeof parsed.classroomId === "string" ? parsed.classroomId : null)
      setDraft({
        title: parsed.draft?.title ?? "",
        description: parsed.draft?.description ?? "",
        deadline: parsed.draft?.deadline ?? "",
      })
      setSelectedProblemIds(Array.isArray(parsed.selectedProblemIds) ? parsed.selectedProblemIds.filter(Boolean) : [])
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  useEffect(() => {
    try {
      if (mode === "idle" && !classroomId && selectedProblemIds.length === 0 && sameDraft(draft, emptyDraft)) {
        sessionStorage.removeItem(STORAGE_KEY)
        return
      }

      sessionStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          mode,
          classroomId,
          draft,
          selectedProblemIds,
        }),
      )
    } catch {
      // ignore storage errors
    }
  }, [classroomId, draft, mode, selectedProblemIds])

  useEffect(() => {
    if (mode !== "picking" || !classroomId) return
    if (pathname === `/classrooms/${classroomId}`) return

    const isStandaloneProblemPage = pathname?.startsWith("/probleme/")
    if (isStandaloneProblemPage) return

    const isClassroomProblemPreview = pathname?.startsWith(`/classrooms/${classroomId}/probleme/`)
    if (isClassroomProblemPreview) return

    reset()
  }, [classroomId, mode, pathname, reset])

  useEffect(() => {
    const onPopState = () => {
      if (historyEntryActiveRef.current) {
        reset()
      }
    }

    window.addEventListener("popstate", onPopState)
    return () => window.removeEventListener("popstate", onPopState)
  }, [reset])

  const startPicking = useCallback(({ classroomId: nextClassroomId, draft: nextDraft }: StartPickingInput) => {
    setMode("picking")
    setClassroomId(nextClassroomId)
    setDraft((prev) => (sameDraft(prev, nextDraft) ? prev : nextDraft))
    setSelectedProblemIds((prev) => (classroomId === nextClassroomId ? prev : []))

    if (!historyEntryActiveRef.current) {
      window.history.pushState({ planckAssignmentDraft: true }, "", window.location.href)
      historyEntryActiveRef.current = true
    }
  }, [classroomId])

  const cancelPicking = useCallback(() => {
    if (historyEntryActiveRef.current) {
      historyEntryActiveRef.current = false
      window.history.back()
      return
    }

    reset()
  }, [reset])

  const isProblemSelected = useCallback(
    (problemId: string) => selectedProblemIds.includes(problemId),
    [selectedProblemIds],
  )

  const addProblem = useCallback((problemId: string) => {
    setSelectedProblemIds((prev) => (prev.includes(problemId) ? prev : [...prev, problemId]))
  }, [])

  const removeProblem = useCallback((problemId: string) => {
    setSelectedProblemIds((prev) => prev.filter((id) => id !== problemId))
  }, [])

  const toggleProblem = useCallback((problemId: string) => {
    setSelectedProblemIds((prev) =>
      prev.includes(problemId) ? prev.filter((id) => id !== problemId) : [...prev, problemId],
    )
  }, [])

  const selectedProblemIdSet = useMemo(() => new Set(selectedProblemIds), [selectedProblemIds])

  const value = useMemo<ClassroomAssignmentDraftContextValue>(
    () => ({
      mode,
      classroomId,
      draft,
      selectedProblemIds,
      selectedProblemIdSet,
      selectedCount: selectedProblemIds.length,
      isPickingForClassroom: (targetClassroomId) =>
        mode === "picking" && classroomId != null && targetClassroomId != null && classroomId === targetClassroomId,
      startPicking,
      cancelPicking,
      isProblemSelected,
      toggleProblem,
      addProblem,
      removeProblem,
    }),
    [
      addProblem,
      cancelPicking,
      classroomId,
      draft,
      isProblemSelected,
      mode,
      removeProblem,
      selectedProblemIdSet,
      selectedProblemIds,
      startPicking,
      toggleProblem,
    ],
  )

  return (
    <ClassroomAssignmentDraftContext.Provider value={value}>
      {children}
    </ClassroomAssignmentDraftContext.Provider>
  )
}

export function useClassroomAssignmentDraft() {
  const context = useContext(ClassroomAssignmentDraftContext)
  if (!context) {
    throw new Error("useClassroomAssignmentDraft must be used within ClassroomAssignmentDraftProvider")
  }
  return context
}
