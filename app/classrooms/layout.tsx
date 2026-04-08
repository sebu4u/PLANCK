import type { ReactNode } from "react"
import nextDynamic from "next/dynamic"
import { ClassroomAssignmentDraftProvider } from "@/components/classrooms/classroom-assignment-draft-context"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { ClassroomsPageSkeleton } from "@/components/classrooms/classroom-skeletons"
import { getClassroomsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

const Navigation = nextDynamic(() => import("@/components/navigation").then((module) => module.Navigation))

const ClassroomsShell = nextDynamic(
  () => import("@/components/classrooms/classrooms-shell").then((module) => module.ClassroomsShell),
  {
    loading: () => (
      <div className="px-4 pb-8 pt-20 md:px-8">
        <ClassroomsPageSkeleton />
      </div>
    ),
  },
)

/** Server Components must read fresh cookies for Supabase session (see lib/supabaseClient.ts). */
export const dynamic = "force-dynamic"

export default async function ClassroomsLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuthenticatedUser()
  const classrooms = user ? await getClassroomsForUser(user.id) : []

  return (
    <DashboardSidebarProvider>
      <ClassroomAssignmentDraftProvider>
        <Navigation />
        <ClassroomsShell classrooms={classrooms}>{children}</ClassroomsShell>
      </ClassroomAssignmentDraftProvider>
    </DashboardSidebarProvider>
  )
}
