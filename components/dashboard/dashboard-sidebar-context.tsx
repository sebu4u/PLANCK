"use client"

import { createContext, useContext, useState, ReactNode } from "react"

interface DashboardSidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

const DashboardSidebarContext = createContext<DashboardSidebarContextType | undefined>(undefined)

export function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)

  const toggle = () => setIsOpen(prev => !prev)

  return (
    <DashboardSidebarContext.Provider value={{ isOpen, setIsOpen, toggle }}>
      {children}
    </DashboardSidebarContext.Provider>
  )
}

export function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext)
  // Return undefined if not in provider (optional context)
  return context
}

