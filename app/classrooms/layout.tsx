import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"
import { DashboardSidebarProvider } from "@/components/dashboard/dashboard-sidebar-context"
import { ClassroomsShell } from "@/components/classrooms/classrooms-shell"
import { getClassroomsForUser, requireAuthenticatedUser } from "@/lib/classrooms/server"

/** Server Components must read fresh cookies for Supabase session (see lib/supabaseClient.ts). */
export const dynamic = "force-dynamic"

export default async function ClassroomsLayout({ children }: { children: ReactNode }) {
  const { user } = await requireAuthenticatedUser()
  const classrooms = user ? await getClassroomsForUser(user.id) : []

  return (
    <DashboardSidebarProvider>
      <Navigation />
      <ClassroomsShell classrooms={classrooms}>{children}</ClassroomsShell>
    </DashboardSidebarProvider>
  )
}
