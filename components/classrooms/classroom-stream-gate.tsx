"use client"

import type { ReactNode } from "react"
import { useClassroomAssignmentDraft } from "@/components/classrooms/classroom-assignment-draft-context"
import ProblemsCatalogClient from "@/components/problems/problems-catalog-client"
import type { Problem } from "@/data/problems"

interface ClassroomStreamGateProps {
  children: ReactNode
  classroomId: string
  isTeacher: boolean
  initialProblems: Problem[]
  initialMonthlyFreeSet: string[]
}

export function ClassroomStreamGate({
  children,
  classroomId,
  isTeacher,
  initialProblems,
  initialMonthlyFreeSet,
}: ClassroomStreamGateProps) {
  const { addProblem, isPickingForClassroom, selectedProblemIds } = useClassroomAssignmentDraft()

  if (!isTeacher || !isPickingForClassroom(classroomId)) {
    return <>{children}</>
  }

  return (
    <ProblemsCatalogClient
      initialProblems={initialProblems}
      initialMonthlyFreeSet={initialMonthlyFreeSet}
      layoutVariant="embedded"
      storageKeyPrefix={`classroom-assignment-${classroomId}`}
      assignmentPicker={{
        selectedProblemIds,
        onAddProblem: addProblem,
        classroomId,
      }}
    />
  )
}
