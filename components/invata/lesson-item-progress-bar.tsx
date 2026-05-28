import { cn } from "@/lib/utils"

interface LessonItemProgressBarProps {
  completed: number
  total: number
  className?: string
}

export function LessonItemProgressBar({ completed, total, className }: LessonItemProgressBarProps) {
  const safeTotal = Math.max(total, 0)
  const safeCompleted = Math.max(0, Math.min(completed, safeTotal > 0 ? safeTotal : completed))
  const percent =
    safeTotal > 0
      ? Math.round((safeCompleted / safeTotal) * 100)
      : safeCompleted > 0
        ? 100
        : 0

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progres lecție: ${percent}%`}
      className={cn("h-2 w-full overflow-hidden rounded-full bg-[#ececec]", className)}
    >
      <div
        className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-[width] duration-300"
        style={{ width: `${percent}%` }}
        aria-hidden="true"
      />
    </div>
  )
}
