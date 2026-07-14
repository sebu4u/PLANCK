import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"

import { pageTitle } from "@/lib/metadata"

export const metadata: Metadata = {
  title: pageTitle("Dashboard părinte"),
}

export const dynamic = "force-dynamic"

export default function ParentDashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navigation />
      {children}
    </>
  )
}
