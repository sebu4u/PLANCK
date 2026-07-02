import type { Metadata } from "next"
import type { ReactNode } from "react"
import { Navigation } from "@/components/navigation"

export const metadata: Metadata = {
  title: "Dashboard părinte | PLANCK",
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
