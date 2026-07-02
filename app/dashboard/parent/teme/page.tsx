import type { Metadata } from "next"
import { ParentAssignmentsPage } from "@/components/dashboard/parent/parent-assignments-page"
import { getChildAssignmentsForParent } from "@/lib/parent/server"
import { requireParentUser } from "@/lib/parent/require-parent"

export const metadata: Metadata = {
  title: "Teme | PLANCK",
  description: "Toate temele copiilor tăi.",
}

export const dynamic = "force-dynamic"

export default async function ParentTemePage() {
  const { user } = await requireParentUser()
  const assignments = await getChildAssignmentsForParent(user.id)

  return <ParentAssignmentsPage assignments={assignments} />
}
