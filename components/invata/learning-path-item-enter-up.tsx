"use client"

import { cn } from "@/lib/utils"
import { useOptionalLearningPathItemNavigation } from "@/components/invata/learning-path-item-navigation-context"

const DELAY_CLASS: Record<number, string> = {
  0: "",
  1: "learning-path-item-enter-up-delay-1",
  2: "learning-path-item-enter-up-delay-2",
  3: "learning-path-item-enter-up-delay-3",
  4: "learning-path-item-enter-up-delay-4",
}

export function learningPathItemEnterUpClass(
  animateFirstItemEntry: boolean | undefined,
  delayIndex = 0,
  className?: string,
) {
  if (!animateFirstItemEntry) return className
  return cn("learning-path-item-enter-up", DELAY_CLASS[delayIndex] ?? "", className)
}

export function LearningPathItemEnterUp({
  delayIndex = 0,
  className,
  children,
  as: Component = "div",
}: {
  delayIndex?: number
  className?: string
  children: React.ReactNode
  as?: "div" | "nav" | "section" | "header" | "main"
}) {
  const nav = useOptionalLearningPathItemNavigation()

  return (
    <Component
      className={learningPathItemEnterUpClass(nav?.animateFirstItemEntry, delayIndex, className)}
    >
      {children}
    </Component>
  )
}
