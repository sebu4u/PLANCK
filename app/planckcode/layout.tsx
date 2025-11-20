'use client'

import type { ReactNode } from 'react'
import { PlanckCodeSettingsProvider } from '@/components/planckcode-settings-provider'

export default function PlanckCodeLayout({ children }: { children: ReactNode }) {
  return <PlanckCodeSettingsProvider>{children}</PlanckCodeSettingsProvider>
}

