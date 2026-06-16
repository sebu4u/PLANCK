"use client"

import { createContext, useContext, type ReactNode } from "react"
import { BIOLOGIE_GRILE_CONFIG, FIZICA_GRILE_CONFIG, type GrileSubjectConfig } from "@/lib/grile-subject-config"

const GrileSubjectContext = createContext<GrileSubjectConfig>(FIZICA_GRILE_CONFIG)

export function GrileSubjectProvider({
  config,
  children,
}: {
  config: GrileSubjectConfig
  children: ReactNode
}) {
  return <GrileSubjectContext.Provider value={config}>{children}</GrileSubjectContext.Provider>
}

export function useGrileSubject() {
  return useContext(GrileSubjectContext)
}
