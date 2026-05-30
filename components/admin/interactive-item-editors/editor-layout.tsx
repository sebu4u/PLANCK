"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function InteractiveItemEditorLayout({
  editor,
  preview,
  className,
}: {
  editor: ReactNode
  preview: ReactNode
  className?: string
}) {
  return (
    <div className={cn("grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]", className)}>
      <div className="min-w-0 space-y-4">{editor}</div>
      <div className="xl:sticky xl:top-4 xl:self-start">{preview}</div>
    </div>
  )
}
