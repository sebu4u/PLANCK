"use client"

import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react"

interface DashboardSidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

const DashboardSidebarContext = createContext<DashboardSidebarContextType | undefined>(undefined)

export function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = useCallback(() => setIsOpen(prev => !prev), [])

  const value = useMemo(() => ({
    isOpen,
    setIsOpen,
    toggle,
  }), [isOpen, toggle])

  return (
    <DashboardSidebarContext.Provider value={value}>
      {children}
    </DashboardSidebarContext.Provider>
  )
}

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext)
  // Return undefined if not in provider (optional context)
  return context
}

