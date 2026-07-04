"use client"

import type { ReactNode } from "react"
import { PlanckCodeSettingsProvider } from "@/components/planckcode-settings-provider"
import { PlanckIdeFloatingProvider } from "@/components/planckcode-floating-provider"
import { PlanckIdeFloatingCard } from "@/components/planckcode-floating-card"
import { PlanckIdeFloatingEntryAnimation } from "@/components/planckcode-floating-entry-animation"

export function PlanckCodeFloatingShell({ children }: { children: ReactNode }) {
  return (
    <PlanckCodeSettingsProvider>
      <PlanckIdeFloatingProvider>
        {children}
        <PlanckIdeFloatingEntryAnimation />
        <PlanckIdeFloatingCard />
      </PlanckIdeFloatingProvider>
    </PlanckCodeSettingsProvider>
  )
}
