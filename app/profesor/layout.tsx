import type { ReactNode } from "react"
import nextDynamic from "next/dynamic"
import { ClassroomAssignmentDraftProvider } from "@/components/classrooms/classroom-assignment-draft-context"

const Navigation = nextDynamic(() => import("@/components/navigation").then((module) => module.Navigation))

export const dynamic = "force-dynamic"

export default function ProfesorLayout({ children }: { children: ReactNode }) {
  return (
    <ClassroomAssignmentDraftProvider>
      <Navigation />
      {children}
    </ClassroomAssignmentDraftProvider>
  )
}
