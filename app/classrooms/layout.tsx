import type { ReactNode } from "react"
import type { Metadata } from "next"
import nextDynamic from "next/dynamic"
import { pageTitle } from "@/lib/metadata"
import { ClassroomAssignmentDraftProvider } from "@/components/classrooms/classroom-assignment-draft-context"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { getClassroomsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"
import { createAdminClient } from "@/lib/supabaseAdmin"
import { normalizeUserType } from "@/lib/user-types"

const Navigation = nextDynamic(() => import("@/components/navigation").then((module) => module.Navigation))

export const metadata: Metadata = {
  title: pageTitle("Săli de clasă"),
  robots: { index: false, follow: false },
}

const ClassroomsShell = nextDynamic(
  () => import("@/components/classrooms/classrooms-shell").then((module) => module.ClassroomsShell),
)

/** Server Components must read fresh cookies for Supabase session (see lib/supabaseClient.ts). */
export const dynamic = "force-dynamic"

export default async function ClassroomsLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuthenticatedUser()
  const classrooms = user ? await getClassroomsForUser(user.id, { includeArchived: true }) : []
  let canCreateClassroom = false
  if (user) {
    const admin = createAdminClient()
    const { data: profile } = await admin.from("profiles").select("user_type").eq("user_id", user.id).maybeSingle()
    canCreateClassroom = normalizeUserType(profile?.user_type) === "profesor"
  }

  return (
    <>
      <div className="fixed inset-0 -z-10 bg-[#ffffff]" />
      <DashboardSidebarProvider>
        <ClassroomAssignmentDraftProvider>
          <Navigation />
          <ClassroomsShell classrooms={classrooms} canCreateClassroom={canCreateClassroom}>
            {children}
          </ClassroomsShell>
        </ClassroomAssignmentDraftProvider>
      </DashboardSidebarProvider>
    </>
  )
}
