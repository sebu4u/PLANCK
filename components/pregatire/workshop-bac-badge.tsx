import { GraduationCap } from "lucide-react"
import { cn } from "@/lib/utils"

export function WorkshopBacBadge({
  className,
  compact = false,
}: {
  className?: string
  compact?: boolean
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 font-semibold uppercase tracking-wide text-amber-800",
        compact ? "text-[10px]" : "text-[11px]",
        className,
      )}
      title="Meditație pentru BAC"
    >
      <GraduationCap className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} aria-hidden />
      {compact ? "BAC" : "Meditație pentru BAC"}
    </span>
  )
}
