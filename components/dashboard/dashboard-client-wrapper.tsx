"use client"

import { DashboardSidebar } from "@/components/dashboard/sidebar"
import { useDashboardSidebar } from "@/components/dashboard/dashboard-sidebar-context"

interface DashboardClientWrapperProps {
  user: {
    id: string
    email: string
    avatar_url?: string
    username?: string
  }
  dashboardHomeHref?: string
  sidebarVariant?: "standard" | "dev"
}

export function DashboardClientWrapper({
  user,
  dashboardHomeHref = "/dashboard",
  sidebarVariant = "standard",
}: DashboardClientWrapperProps) {
  const { isOpen, setIsOpen } = useDashboardSidebar()

  return (
    <DashboardSidebar
      user={user}
      open={isOpen}
      onOpenChange={setIsOpen}
      dashboardHomeHref={dashboardHomeHref}
      sidebarVariant={sidebarVariant}
    />
  )
}
